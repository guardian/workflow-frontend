import path from "path";
import fs from "fs";
import os from "os";
import {
    GenericContainer,
    StartedNetwork,
    StartedTestContainer,
    Wait,
} from "testcontainers";
import { buildImage, createLogConsumer } from "./dockerHelpers";
import { seedS3 } from "./seedS3";
import { seedDynamodb } from "./seedDynamodb";
import type { PanDomainKeys } from "../panDomainKeys";

// LocalStack accepts any credentials by default (signature validation is off);
// the conventional dummy pair keeps the SDKs and awslocal happy.
export const S3_ACCESS_KEY_ID = "test";
export const S3_SECRET_ACCESS_KEY = "test";
// LocalStack only parses the bucket from the Host header when it contains
// `.s3.`, so the S3 endpoint host (and the per-bucket network aliases) must sit
// under an `s3.` domain for the app's virtual-hosted-style S3 requests to
// resolve to the right bucket. See startAws's network aliases below.
const S3_ENDPOINT_HOST = "s3.localstack";
// Plain network alias for the LocalStack container, used for non-S3 endpoints
// (e.g. DynamoDB) that don't need the `s3.` virtual-host domain.
const LOCALSTACK_HOST = "localstack";
// LocalStack serves every enabled service (S3, DynamoDB, ...) on this one port.
const LOCALSTACK_PORT = 4566;
// Stock LocalStack image; the buckets/objects and DynamoDB table the app reads
// are seeded from the host after start, so no custom image build is needed.
const LOCALSTACK_IMAGE = "localstack/localstack:4";

// All mocks share one WireMock image; each container only bind-mounts a
// different fixture root (mappings/ + __files/) and tweaks its command flags.
const WIREMOCK_IMAGE = "wiremock/wiremock:3.13.2";
// The auth-redirect container is stock nginx with a bind-mounted config template.
const AUTH_REDIRECT_IMAGE = "nginx:alpine";
// WireMock is told to read its stubs from this bind-mounted dir rather than the
// image default (/home/wiremock), so nothing in the base image is shadowed.
const WIREMOCK_ROOT_DIR = "/wiremock-root";

export const WIREMOCK_HTTP_PORT = 80;
// Fixed host port for the optional host-browser auth-cookie endpoint. Kept
// stable (and forwarded in the devcontainer) so it can be bookmarked.
const NGINX_PORT = 80;
const HOST_AUTH_PORT = 9090;
export const CONTAINER_FRONTEND_PORT = 9090;
const HOST_FRONTEND_PORT = 9091;
// Container name and upstream the auth-redirect container proxies non-login
// traffic to; resolved inside the Docker network at request time.
const FRONTEND_NAME = "workflow-frontend";
const FRONTEND_HOSTNAME = "workflow";
const FRONTEND_UPSTREAM = `${FRONTEND_HOSTNAME}.local.dev-gutools.co.uk`;
const DATASTORE_NAME = "workflow-datastore";
export const CAPI_HOSTNAME = "iam-preview-content";
const PREFERENCES_HOSTNAME = "preferences";
const TAG_MANAGER_HOSTNAME = "tagmanager";
export const COMPOSER_HOSTNAME = "composer";
const HOST_COMPOSER_HTTP_PORT = 9081;
const PRESENCE_HOSTNAME = "presence";
const HOST_PRESENCE_HTTP_PORT = 9070;
export const TELEMETRY_HOSTNAME = "user-telemetry";
const HOST_TELEMETRY_HTTP_PORT = 3132;

export async function startAws(
    network: StartedNetwork,
    e2eRoot: string,
    panDomainKeys: PanDomainKeys,
    streamLogs: boolean,
): Promise<StartedTestContainer> {
    const awsContainer = await new GenericContainer(LOCALSTACK_IMAGE)
        .withNetwork(network)
        // `s3.localstack` is the S3 endpoint host; the per-bucket subdomains are
        // what the app's virtual-hosted-style S3 requests resolve to, and each
        // embeds `.s3.` so LocalStack extracts the bucket name. `localstack` is
        // the plain alias DynamoDB (and other services) are reached on.
        .withNetworkAliases(
            LOCALSTACK_HOST,
            S3_ENDPOINT_HOST,
            `permissions-cache.${S3_ENDPOINT_HOST}`,
            `pan-domain-auth-settings.${S3_ENDPOINT_HOST}`,
        )
        .withEnvironment({
            SERVICES: "s3,dynamodb",
            AWS_DEFAULT_REGION: "eu-west-1",
        })
        .withLogConsumer(createLogConsumer("localstack", streamLogs))
        .withExposedPorts(LOCALSTACK_PORT)
        .withWaitStrategy(Wait.forLogMessage(/Ready\./, 1))
        .withStartupTimeout(5 * 60 * 1000)
        .start();

    // Seed the S3 objects and DynamoDB table the app reads before returning.
    await seedS3(awsContainer, e2eRoot, panDomainKeys);
    await seedDynamodb(awsContainer, e2eRoot);

    return awsContainer;
}

type MockPortMapping = number | { container: number; host: number };

interface MockWiremockConfig {
    /** Container name and log prefix for this mock. */
    name: string;
    /** fixtures/<dir> folder holding this mock's WireMock root (mappings/ + __files/). */
    fixtureDir: string;
    /** Hostname advertised to devcontainer-nginx. */
    hostname: string;
    /** Port to expose; a fixed host port is used only where one is required. */
    port: MockPortMapping;
    /** Disable WireMock response templating (e.g. presence serves a JS body verbatim). */
    templating?: boolean;
}

export const MOCK_WIREMOCK_CONFIGS: Record<string, MockWiremockConfig> = {
    capi: {
        name: "mock-capi",
        fixtureDir: "capi",
        hostname: CAPI_HOSTNAME,
        port: WIREMOCK_HTTP_PORT,
        templating: true,
    },
    composer: {
        name: "mock-composer",
        fixtureDir: "composer",
        hostname: COMPOSER_HOSTNAME,
        port: { container: HOST_COMPOSER_HTTP_PORT, host: HOST_COMPOSER_HTTP_PORT },
        templating: true,
    },
    presence: {
        name: "mock-presence",
        fixtureDir: "presence",
        hostname: PRESENCE_HOSTNAME,
        port: { container: HOST_PRESENCE_HTTP_PORT, host: HOST_PRESENCE_HTTP_PORT },
    },
    telemetry: {
        name: "mock-telemetry",
        fixtureDir: "telemetry",
        hostname: TELEMETRY_HOSTNAME,
        port: { container: HOST_TELEMETRY_HTTP_PORT, host: HOST_TELEMETRY_HTTP_PORT },
        templating: true,
    },
    preferences: {
        name: "mock-preferences",
        fixtureDir: "preferences",
        hostname: PREFERENCES_HOSTNAME,
        port: WIREMOCK_HTTP_PORT,
        templating: true,
    },
    tagmanager: {
        name: "mock-tagmanager",
        fixtureDir: "tagmanager",
        hostname: TAG_MANAGER_HOSTNAME,
        port: WIREMOCK_HTTP_PORT,
        templating: true,
    },
};

// Start one WireMock mock from the shared image, bind-mounting fixtures/<name>
// as its stub root. Runs as root so WireMock can bind the privileged port 80.
export async function startMockWiremock(
    config: MockWiremockConfig,
    e2eRoot: string,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    const containerPort = typeof config.port === "number" ? config.port : config.port.container;
    const command = [
        "--root-dir",
        WIREMOCK_ROOT_DIR,
        "--port",
        String(containerPort),
        "--verbose",
        ...(config.templating ? ["--local-response-templating"] : []),
    ];
    return new GenericContainer(WIREMOCK_IMAGE)
        .withName(config.name)
        .withLabels({ 
            "devcontainer.hostname": config.hostname,
            "devcontainer.application.port": String(containerPort),
        })
        .withUser("root")
        .withNetwork(network)
        .withBindMounts([
            {
                source: path.join(e2eRoot, "fixtures", config.fixtureDir),
                target: WIREMOCK_ROOT_DIR,
                mode: "ro",
            },
        ])
        .withCommand(command)
        .withLogConsumer(createLogConsumer(config.name, streamLogs))
        .withExposedPorts(config.port)
        .withWaitStrategy(
            Wait.forHttp("/__admin/health", containerPort).forStatusCode(
                200,
            ),
        )
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export async function startDb(
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return new GenericContainer("postgres:17-alpine")
        .withNetwork(network)
        .withNetworkAliases("workflow-db-e2e.local.dev-gutools.co.uk")
        .withEnvironment({
            POSTGRES_USER: "workflow",
            POSTGRES_PASSWORD: "workflow",
            POSTGRES_DB: "workflow",
        })
        .withLogConsumer(createLogConsumer("workflow-db", streamLogs))
        .withExposedPorts(5432)
        .withWaitStrategy(
            Wait.forLogMessage(
                /database system is ready to accept connections/,
                2,
            ),
        )
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

// Bind-mount the devcontainer's persistent coursier/ivy cache volumes (see
// .devcontainer/*/devcontainer.json) into sbt containers as their dependency
// caches, so `sbt update`/`run` reuse artifacts already fetched from Maven
// Central across container/image rebuilds instead of re-downloading them.
// Falls back to no extra mounts when run outside that devcontainer.
function sbtCacheBindMounts(): { source: string; target: string; mode: "rw" }[] {
    const coursierCacheDir = process.env.DEVENV_COURSIER_CACHE_MOUNT_DIR;
    const ivyCacheDir = process.env.DEVENV_IVY_CACHE_MOUNT_DIR;
    const mounts: { source: string; target: string; mode: "rw" }[] = [];
    if (coursierCacheDir) {
        mounts.push({ source: coursierCacheDir, target: "/root/.cache/coursier", mode: "rw" });
    }
    if (ivyCacheDir) {
        mounts.push({ source: ivyCacheDir, target: "/root/.ivy2", mode: "rw" });
    }
    return mounts;
}

function buildDatastoreImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    console.log(`process.env.WORKFLOW_BACKEND_DIR is ${process.env.WORKFLOW_BACKEND_DIR ?? "(not set)"}`);
    const backendDir = getBackendDir(e2eRoot);
    // The image only bakes the JVM toolchain, so the build context is a tiny
    // temp folder holding just .tool-versions plus the Dockerfile (which must
    // live inside the context for fromDockerfile). Recreated fresh each run.
    const buildContext = path.join(e2eRoot, "target/datastore-build-context");
    fs.rmSync(buildContext, { recursive: true, force: true });
    fs.mkdirSync(buildContext, { recursive: true });
    fs.copyFileSync(
        path.join(backendDir, ".tool-versions"),
        path.join(buildContext, ".tool-versions"),
    );
    fs.copyFileSync(
        path.join(e2eRoot, "images/datastore.Dockerfile"),
        path.join(buildContext, "datastore.Dockerfile"),
    );
    fs.copyFileSync(
        path.join(e2eRoot, "images/trust-local-ca"),
        path.join(buildContext, "trust-local-ca"),
    );
    return buildImage(buildContext, "datastore.Dockerfile", imageTag);
}

export async function startDevcontainerNginx(
    e2eRoot: string,
    imageTag: string,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<StartedTestContainer> {
    const nginxDir = path.resolve(
        process.env.DEVCONTAINER_NGINX_DIR ??
            path.join(e2eRoot, "target/devcontainer-nginx"),
    );
    const nginxImage = await buildImage(nginxDir, "Dockerfile", imageTag);
    const certsDir = path.resolve(nginxDir, process.env.CERTS_DIR || "certs");
    const logsDir = path.join(nginxDir, "logs");
    return nginxImage
        .withName("devcontainer-nginx")
        .withNetwork(network)
        .withNetworkAliases(
            "workflow.local.dev-gutools.co.uk",
            "workflow-datastore.local.dev-gutools.co.uk",
            "composer.local.dev-gutools.co.uk",
            "presence.local.dev-gutools.co.uk",
            "user-telemetry.local.dev-gutools.co.uk",
            "iam-preview-content.local.dev-gutools.co.uk",
            "tagmanager.local.dev-gutools.co.uk",
        )
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
        .withLogConsumer(createLogConsumer("devcontainer-nginx", streamLogs))
        .withExposedPorts(
            { container: 80, host: 80 },
            { container: 443, host: 443 },
        )
        .withWaitStrategy(Wait.forHealthCheck())
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export async function startDatastore(
    e2eRoot: string,
    imageTag: string,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    const backendDir = getBackendDir(e2eRoot);
    const datastoreImage = await buildDatastoreImage(e2eRoot, imageTag);
    return datastoreImage
        .withName(DATASTORE_NAME)
        .withLabels({ "devcontainer.hostname": DATASTORE_NAME })
        .withNetwork(network)
        // Mount the whole backend checkout so sbt runs from source without
        // baking it into the image. Read-write because sbt writes target/ dirs.
        .withBindMounts([
            { source: backendDir, target: "/workflow-backend", mode: "rw" },
            {
                source: path.join(os.homedir(), ".local/share/mkcert/rootCA.pem"),
                target: "/etc/workflow-local-ca/rootCA.pem",
                mode: "ro",
            },
            ...sbtCacheBindMounts(),
        ])
        .withLogConsumer(createLogConsumer("datastore", streamLogs))
        .withExposedPorts(9095)
        .withStartupTimeout(10 * 60 * 1000)
        .withWaitStrategy(
             Wait.forHttp("/management/healthcheck", 9095).forStatusCode(200)
        )
        .start();
}

export async function startAuthRedirect(
    e2eRoot: string,
    network: StartedNetwork,
    cookieValue: string,
    streamLogs: boolean,
): Promise<any> {
    // nginx:alpine's entrypoint runs envsubst over /etc/nginx/templates/*.template
    // at startup, so bind-mounting the config template needs no image build.
    return new GenericContainer(AUTH_REDIRECT_IMAGE)
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
        .withLogConsumer(createLogConsumer("auth-redirect", streamLogs))
        .withExposedPorts({ container: NGINX_PORT, host: HOST_AUTH_PORT })
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

function buildWorkflowImage(
    repoRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    // Toolchain-only image: build context is a tiny temp folder holding just
    // .tool-versions plus the Dockerfile (which must live inside the context).
    const buildContext = path.join(repoRoot, "target/workflow-build-context");
    fs.rmSync(buildContext, { recursive: true, force: true });
    fs.mkdirSync(buildContext, { recursive: true });
    fs.copyFileSync(
        path.join(repoRoot, ".tool-versions"),
        path.join(buildContext, ".tool-versions"),
    );
    fs.copyFileSync(
        path.join(repoRoot, "e2e-tests/images/workflow-frontend.Dockerfile"),
        path.join(buildContext, "workflow-frontend.Dockerfile"),
    );
    fs.copyFileSync(
        path.join(repoRoot, "e2e-tests/images/trust-local-ca"),
        path.join(buildContext, "trust-local-ca"),
    );
    return buildImage(buildContext, "workflow-frontend.Dockerfile", imageTag);
}

export async function startWorkflow(
    repoRoot: string,
    imageTag: string,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    const workflowImage = await buildWorkflowImage(repoRoot, imageTag);
    return workflowImage
        .withName(FRONTEND_NAME)
        .withLabels({ "devcontainer.hostname": FRONTEND_HOSTNAME })
        .withNetwork(network)
        // Mount the whole repo so webpack (build-dev watch) and Play dev-mode
        // run from source without an image rebuild. Read-write because sbt and
        // webpack write target/ and public/build into it.
        .withBindMounts([
            { source: repoRoot, target: "/workflow-frontend", mode: "rw" },
            {
                source: path.join(os.homedir(), ".local/share/mkcert/rootCA.pem"),
                target: "/etc/workflow-local-ca/rootCA.pem",
                mode: "ro",
            },
            ...sbtCacheBindMounts(),
        ])
        .withEnvironment({
            AWS_ENDPOINT_URL_S3: `http://${S3_ENDPOINT_HOST}:${LOCALSTACK_PORT}`,
            AWS_ENDPOINT_URL_DYNAMODB: `http://${LOCALSTACK_HOST}:${LOCALSTACK_PORT}`,
            AWS_ACCESS_KEY_ID: S3_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: S3_SECRET_ACCESS_KEY,
            // Keep local mode enabled in case scripts are bypassed in future changes.
            LOCAL: "true",
        })
        .withLogConsumer(createLogConsumer("workflow-frontend", streamLogs))
        .withExposedPorts({ container: CONTAINER_FRONTEND_PORT, host: HOST_FRONTEND_PORT })
        .withStartupTimeout(10 * 60 * 1000)
        .withWaitStrategy(
            Wait.forHttp("/management/healthcheck", CONTAINER_FRONTEND_PORT).forStatusCode(200)
        )
        .start();
}
