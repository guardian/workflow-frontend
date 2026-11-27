import path from "path";
import fs from "fs";
import os from "os";
import { ApplicationContainer, LocalAwsContainer, MockApiContainer } from "@guardian/end-to-end-testing";
import {
    GenericContainer,
    StartedNetwork,
    StartedTestContainer,
    Wait,
} from "testcontainers";
import type { StackDiagnostics } from "../stackDiagnostics";

// LocalStack accepts any credentials by default (signature validation is off);
// the conventional dummy pair keeps the SDKs and awslocal happy.
export const S3_ACCESS_KEY_ID = "test";
export const S3_SECRET_ACCESS_KEY = "test";
const LOCALSTACK_HOST = "localstack";
const LOCALSTACK_ROUTE_HOST = `${LOCALSTACK_HOST}.local.dev-gutools.co.uk`;
const S3_ENDPOINT_HOST = `s3.${LOCALSTACK_ROUTE_HOST}`;
const S3_ROUTE_ALIASES = [
    S3_ENDPOINT_HOST,
    `permissions-cache.${S3_ENDPOINT_HOST}`,
    `pan-domain-auth-settings.${S3_ENDPOINT_HOST}`,
];
// LocalStack serves every enabled service (S3, DynamoDB, ...) on this one port.
const LOCALSTACK_PORT = 4566;

// The auth-redirect container is stock nginx with a bind-mounted config template.
const AUTH_REDIRECT_IMAGE = "nginx:alpine";
const CHEKOV_IMAGE = "ghcr.io/guardian/chekov/nginx:sha-bba0c91f9bc695df29e550b9ecd3bbc2b79d2d38";

// Fixed host port for the optional host-browser auth-cookie endpoint. Kept
// stable (and forwarded in the devcontainer) so it can be bookmarked.
export const NGINX_PORT = 80;
const HOST_AUTH_PORT = 9090;
export const CONTAINER_FRONTEND_PORT = 9090;
// Container name and upstream the auth-redirect container proxies non-login
// traffic to; resolved inside the Docker network at request time.
const FRONTEND_NAME = "workflow-frontend";
const FRONTEND_HOSTNAME = "workflow";
const FRONTEND_UPSTREAM = `${FRONTEND_NAME}:${CONTAINER_FRONTEND_PORT}`;
const DATASTORE_NAME = "workflow-datastore";
const DATASTORE_PORT = 9095;
export const CAPI_HOSTNAME = "iam-preview-content";
const PREFERENCES_HOSTNAME = "preferences";
const TAG_MANAGER_HOSTNAME = "tagmanager";
export const COMPOSER_HOSTNAME = "composer";
const HOST_COMPOSER_HTTP_PORT = 9081;
const PRESENCE_HOSTNAME = "presence";
const HOST_PRESENCE_HTTP_PORT = 9070;
export const TELEMETRY_HOSTNAME = "user-telemetry";
const HOST_TELEMETRY_HTTP_PORT = 3132;
// MockApiContainer always serves WireMock on this container port.
const MOCK_API_CONTAINER_PORT = 80;

interface ContainerOptions {
    network: StartedNetwork;
    diagnostics: StackDiagnostics;
}

export async function startAws({
    network,
    diagnostics,
}: ContainerOptions): Promise<StartedTestContainer> {
    return new LocalAwsContainer({
        name: LOCALSTACK_HOST,
        network,
        hostname: LOCALSTACK_HOST,
        containerPort: LOCALSTACK_PORT,
    })
        .withEnvironment({ SERVICES: "s3,dynamodb" })
        .withLogConsumer((stream) => diagnostics.capture("containers", "localstack", stream))
        // Stricter than the default 200 check: wait until S3 and DynamoDB are up.
        .withWaitStrategy(
            Wait.forHttp("/_localstack/health", LOCALSTACK_PORT)
                .forStatusCode(200)
                .forResponsePredicate((response) => {
                    const { services } = JSON.parse(response);
                    return ["s3", "dynamodb"].every((service) =>
                        ["available", "running"].includes(services?.[service]),
                    );
                }),
        )
        .start();
}

interface MockWiremockConfig {
    /** Container name and log prefix for this mock. */
    name: string;
    /** fixtures/<dir> folder holding this mock's WireMock root (mappings/ + __files/). */
    fixtureDir: string;
    /** Hostname advertised to devcontainer-nginx. */
    hostname: string;
    /** Fixed host port, for mocks accessed directly from the host; random otherwise. */
    hostPort?: number;
    /** Disable WireMock response templating (e.g. presence serves a JS body verbatim). */
    templating?: boolean;
}

export const MOCK_WIREMOCK_CONFIGS: Record<string, MockWiremockConfig> = {
    capi: {
        name: "mock-capi",
        fixtureDir: "capi",
        hostname: CAPI_HOSTNAME,
        templating: true,
    },
    composer: {
        name: "mock-composer",
        fixtureDir: "composer",
        hostname: COMPOSER_HOSTNAME,
        hostPort: HOST_COMPOSER_HTTP_PORT,
        templating: true,
    },
    presence: {
        name: "mock-presence",
        fixtureDir: "presence",
        hostname: PRESENCE_HOSTNAME,
        hostPort: HOST_PRESENCE_HTTP_PORT,
    },
    telemetry: {
        name: "mock-telemetry",
        fixtureDir: "telemetry",
        hostname: TELEMETRY_HOSTNAME,
        hostPort: HOST_TELEMETRY_HTTP_PORT,
        templating: true,
    },
    preferences: {
        name: "mock-preferences",
        fixtureDir: "preferences",
        hostname: PREFERENCES_HOSTNAME,
        templating: true,
    },
    tagmanager: {
        name: "mock-tagmanager",
        fixtureDir: "tagmanager",
        hostname: TAG_MANAGER_HOSTNAME,
        templating: true,
    },
};

export async function startMockWiremock({
    config,
    e2eRoot,
    network,
    diagnostics,
}: ContainerOptions & {
    config: MockWiremockConfig;
    e2eRoot: string;
}): Promise<StartedTestContainer> {
    const container = new MockApiContainer({
        name: config.name,
        network,
        fixtureDir: path.join(e2eRoot, "fixtures", config.fixtureDir),
        hostnames: [config.hostname],
        templating: config.templating,
    }).withLogConsumer((stream) => diagnostics.capture("containers", config.name, stream));
    if (config.hostPort) {
        // Overrides the random host binding MockApiContainer gives its port.
        container.withExposedPorts({ container: MOCK_API_CONTAINER_PORT, host: config.hostPort });
    }
    return container.start();
}

export async function startDb({
    network,
    diagnostics,
}: ContainerOptions): Promise<StartedTestContainer> {
    return new GenericContainer("postgres:17-alpine")
        .withName("workflow-postgres")
        .withNetwork(network)
        .withNetworkAliases("workflow-db-e2e.local.dev-gutools.co.uk")
        .withEnvironment({
            POSTGRES_USER: "workflow",
            POSTGRES_PASSWORD: "workflow",
            POSTGRES_DB: "workflow",
        })
        .withLogConsumer((stream) => diagnostics.capture("containers", "postgres", stream))
        .withExposedPorts(5432)
        .withHealthCheck({
            test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U workflow -d workflow"],
            interval: 1000,
            timeout: 3000,
            retries: 60,
        })
        .withWaitStrategy(Wait.forHealthCheck())
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

// Resolve the guardian/workflow backend checkout used as the source of the
// datastore build (.tool-versions) and its bind-mounted sources at runtime.
function getBackendDir(e2eRoot: string): string {
    return (
        process.env.WORKFLOW_BACKEND_DIR ??
        path.join(e2eRoot, "target/workflow-backend")
    );
}

export async function startDevcontainerNginx(
    e2eRoot: string,
    network: StartedNetwork,
    diagnostics: StackDiagnostics,
): Promise<StartedTestContainer> {
    const nginxDir = path.resolve(e2eRoot, "target/chekov");
    const certsDir = path.resolve(nginxDir, process.env.CERTS_DIR || "certs");
    const logsDir = path.join(nginxDir, "logs");
    fs.mkdirSync(certsDir, { recursive: true });
    fs.mkdirSync(logsDir, { recursive: true });
    return new GenericContainer(CHEKOV_IMAGE)
        .withName("devcontainer-nginx")
        .withNetwork(network)
        .withBindMounts([
            { source: "/var/run/docker.sock", target: "/var/run/docker.sock", mode: "ro" },
            { source: certsDir, target: "/etc/nginx/certs", mode: "ro" },
            {
                source: path.join(os.homedir(), ".local/share/mkcert"),
                target: "/etc/nginx/mkcert",
                mode: "ro",
            },
            { source: logsDir, target: "/var/log/nginx", mode: "rw" },
            { source: logsDir, target: "/var/log/devcontainer-nginx", mode: "rw" },
        ])
        .withEnvironment({
            BASE_DOMAIN: "local.dev-gutools.co.uk",
            DOCKER_SOCKET: "/var/run/docker.sock",
            NGINX_CONFIG_PATH: "/etc/nginx/conf.d/generated.conf",
            TLS_CERT: "/etc/nginx/certs/wildcard.crt",
            TLS_KEY: "/etc/nginx/certs/wildcard.key",
            LOCAL_CA_CERT: "/etc/nginx/mkcert/rootCA.pem",
            LOCAL_CA_KEY: "/etc/nginx/mkcert/rootCA-key.pem",
            DEBOUNCE_MS: "500",
        })
        .withLogConsumer((stream) => diagnostics.capture("containers", "devcontainer-nginx", stream))
        .withExposedPorts(
            { container: 80, host: 80 },
            { container: 443, host: 443 },
        )
        .withWaitStrategy(Wait.forHealthCheck())
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export async function startDatastore({
    e2eRoot,
    network,
    diagnostics,
}: ContainerOptions & { e2eRoot: string }): Promise<StartedTestContainer> {
    return new ApplicationContainer({
        name: DATASTORE_NAME,
        network,
        exposedPorts: [{ port: DATASTORE_PORT, hostNames: [DATASTORE_NAME] }],
        healthCheckPort: DATASTORE_PORT,
        healthCheckPath: "/management/healthcheck",
        projectHostPath: getBackendDir(e2eRoot),
        projectContainerPath: "/workflow-backend",
        caRootCertFile: path.join(os.homedir(), ".local/share/mkcert/rootCA.pem"),
        coursierCacheDir: process.env.DEVENV_COURSIER_CACHE_MOUNT_DIR,
        ivyCacheDir: process.env.DEVENV_IVY_CACHE_MOUNT_DIR,
    })
        .withCommand([
            "mise", "exec", "--", "sbt",
            "-Dconfig.file=datastore/conf/application.e2e.conf",
            `datastore/run ${DATASTORE_PORT}`,
        ])
        .withEnvironment({ AWS_SDK_LOAD_CONFIG: "1" })
        .withLogConsumer((stream) => diagnostics.capture("containers", "datastore", stream))
        .start();
}

export async function startAuthRedirect({
    e2eRoot,
    network,
    cookieValue,
    diagnostics,
}: ContainerOptions & {
    e2eRoot: string;
    cookieValue: string;
}): Promise<StartedTestContainer> {
    // nginx:alpine's entrypoint runs envsubst over /etc/nginx/templates/*.template
    // at startup, so bind-mounting the config template needs no image build.
    return new GenericContainer(AUTH_REDIRECT_IMAGE)
        // "nginx" in the name stops chekov treating this as a dev container and probing it.
        .withName("auth-redirect-nginx")
        .withNetwork(network)
        .withBindMounts([
            {
                source: path.join(
                    e2eRoot,
                    "fixtures/auth-redirect/auth-redirect.conf.template",
                ),
                target: "/etc/nginx/templates/default.conf.template",
                mode: "ro",
            },
        ])
        .withEnvironment({
            AUTH_COOKIE_NAME: "gutoolsAuth-assym",
            AUTH_COOKIE_VALUE: cookieValue,
            FRONTEND_UPSTREAM,
        })
        .withLogConsumer((stream) => diagnostics.capture("containers", "auth-redirect", stream))
        .withExposedPorts({ container: NGINX_PORT, host: HOST_AUTH_PORT })
        .withWaitStrategy(
            Wait.forHttp("/management/healthcheck", NGINX_PORT).forStatusCode(200),
        )
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export async function startWorkflow({
    e2eRoot,
    network,
    diagnostics,
}: ContainerOptions & { e2eRoot: string }): Promise<StartedTestContainer> {
    return new ApplicationContainer({
        name: FRONTEND_NAME,
        network,
        exposedPorts: [{ port: CONTAINER_FRONTEND_PORT, hostNames: [FRONTEND_HOSTNAME] }],
        healthCheckPort: CONTAINER_FRONTEND_PORT,
        healthCheckPath: "/management/healthcheck",
        projectHostPath: path.resolve(e2eRoot, ".."),
        projectContainerPath: "/workflow-frontend",
        caRootCertFile: path.join(os.homedir(), ".local/share/mkcert/rootCA.pem"),
        coursierCacheDir: process.env.DEVENV_COURSIER_CACHE_MOUNT_DIR,
        ivyCacheDir: process.env.DEVENV_IVY_CACHE_MOUNT_DIR,
    })
        .withExtraHosts([
            { host: "composer.local.dev-gutools.co.uk", ipAddress: "host-gateway" },
            { host: "workflow-datastore.local.dev-gutools.co.uk", ipAddress: "host-gateway" },
            { host: "user-telemetry.local.dev-gutools.co.uk", ipAddress: "host-gateway" },
            { host: "iam-preview-content.local.dev-gutools.co.uk", ipAddress: "host-gateway" },
            { host: "tagmanager.local.dev-gutools.co.uk", ipAddress: "host-gateway" },
            ...[LOCALSTACK_ROUTE_HOST, ...S3_ROUTE_ALIASES].map(host => ({
                host,
                ipAddress: "host-gateway",
            })),
        ])
        .withCommand(["mise", "exec", "--", "bash", "e2e-tests/images/start-workflow-frontend"])
        .withEnvironment({
            AWS_ENDPOINT_URL_S3: `https://${S3_ENDPOINT_HOST}`,
            AWS_ENDPOINT_URL_DYNAMODB: `https://${LOCALSTACK_ROUTE_HOST}`,
            AWS_ACCESS_KEY_ID: S3_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: S3_SECRET_ACCESS_KEY,
            // Keep local mode enabled in case scripts are bypassed in future changes.
            LOCAL: "true",
        })
        .withLogConsumer((stream) => diagnostics.capture("containers", "workflow", stream))
        .start();
}
