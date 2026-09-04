import path from "path";
import fs from "fs";
import { GenericContainer, StartedNetwork, Wait } from "testcontainers";
import { buildImage, createLogConsumer } from "./dockerHelpers";
import type { PanDomainKeys } from "../panDomainKeys";

export const MINIO_ROOT_USER = "minioadmin";
export const MINIO_ROOT_PASSWORD = "minioadmin";

// All mocks share one WireMock image; each container only bind-mounts a
// different fixture root (mappings/ + __files/) and tweaks its command flags.
const WIREMOCK_IMAGE = "wiremock/wiremock:3.13.2";
// The auth-redirect container is stock nginx with a bind-mounted config template.
const AUTH_REDIRECT_IMAGE = "nginx:alpine";
// WireMock is told to read its stubs from this bind-mounted dir rather than the
// image default (/home/wiremock), so nothing in the base image is shadowed.
const WIREMOCK_ROOT_DIR = "/wiremock-root";

// In local dev the restorer runs as the DEV identity, whose effective stage is
// CODE, so it resolves each stack's real per-stage flexible-content API host
// (see app/models/FlexibleStack.scala and app/config/AppConfig.scala). We
// register those exact hostnames as network aliases on the mock container, so
// the real hostnames resolve to the mock inside the Docker network — no
// config/URL override required.
export const WIREMOCK_HTTP_PORT = 80;
// Container port the https-serving mocks (composer, presence, telemetry) listen
// on; Chromium host-resolver-rules map each mock's hostname to its fixed host port.
const WIREMOCK_HTTPS_PORT = 8443;
// Fixed host port for the optional host-browser auth-cookie endpoint. Kept
// stable (and forwarded in the devcontainer) so it can be bookmarked.
const NGINX_PORT = 80;
const HOST_AUTH_PORT = 9090;
export const CONTAINER_FRONTEND_PORT = 9090;
const HOST_FRONTEND_PORT = 9091;
// Network alias and upstream the auth-redirect container proxies non-login
// traffic to; resolved inside the Docker network at request time.
const FRONTEND_ALIAS = "workflow-frontend";
const FRONTEND_UPSTREAM = `${FRONTEND_ALIAS}:${CONTAINER_FRONTEND_PORT}`;
const CAPI_HOSTNAME = "iam-preview.content.local.dev-guardianapis.com";
const PREFERENCES_HOSTNAME = "preferences.local.dev-gutools.co.uk";
const TAG_MANAGER_HOSTNAME = "tagmanager.local.dev-gutools.co.uk";
const COMPOSER_HOSTNAME = "composer.local.dev-gutools.co.uk";
// Composer is called from the browser cross-origin over https; the mock serves
// https on this fixed host port, which Chromium host-resolver-rules maps
// COMPOSER_HOSTNAME to. Forwarded in the devcontainer as "Composer API".
const HOST_COMPOSER_HTTP_PORT = 9081;
const HOST_COMPOSER_HTTPS_PORT = 9082;
const PRESENCE_HOSTNAME = "presence.local.dev-gutools.co.uk";
// Presence's client library is loaded by the browser over https; the mock serves
// it on this fixed host port, which Chromium host-resolver-rules maps
// PRESENCE_HOSTNAME to. Forwarded in the devcontainer as "Presence".
const HOST_PRESENCE_HTTP_PORT = 9070;
const HOST_PRESENCE_HTTPS_PORT = 9071;
const TELEMETRY_HOSTNAME = "user-telemetry.local.dev-gutools.co.uk";
// Telemetry is called from the browser over https; the mock serves it on this
// fixed host port, which Chromium host-resolver-rules maps TELEMETRY_HOSTNAME
// to. Forwarded in the devcontainer as "User telemetry".
const HOST_TELEMETRY_HTTP_PORT = 3132;
const HOST_TELEMETRY_HTTPS_PORT = 3133;

export function buildMinioImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(e2eRoot, "images/minio.Dockerfile", imageTag);
}

export async function startMinio(
    minioImage: GenericContainer,
    network: StartedNetwork,
    panDomainKeys: PanDomainKeys,
    streamLogs: boolean,
): Promise<any> {
    return minioImage
        .withNetwork(network)
        .withNetworkAliases(
            "minio",
            "permissions-cache.minio",
            "pan-domain-auth-settings.minio",
        )
        .withEnvironment({
            MINIO_ROOT_USER,
            MINIO_ROOT_PASSWORD,
            MINIO_DOMAIN: "minio",
            PAN_DOMAIN_PRIVATE_KEY: panDomainKeys.privateKeyBase64,
            PAN_DOMAIN_PUBLIC_KEY: panDomainKeys.publicKeyBase64,
            PAN_DOMAIN_BUCKET: "pan-domain-auth-settings",
            PERMISSIONS_BUCKET: "permissions-cache",
        })
        .withLogConsumer(createLogConsumer("minio", streamLogs))
        .withExposedPorts(9000, 9001)
        .withWaitStrategy(Wait.forLogMessage(/Ensured permissions object exists:/, 1))
        .withStartupTimeout(5 * 60 * 1000)
        .start();
}

type MockPortMapping = number | { container: number; host: number };

interface MockWiremockConfig {
    /** Log prefix for this mock's container output. */
    name: string;
    /** fixtures/<dir> folder holding this mock's WireMock root (mappings/ + __files/). */
    fixtureDir: string;
    /** Docker network alias(es) the frontend/browser resolve to this mock. */
    aliases: string[];
    /** Ports to expose; a fixed host port is used only where one is required. */
    ports: MockPortMapping[];
    /** Serve https on 8443 (browser cross-origin mocks) in addition to http. */
    https?: boolean;
    /** Disable WireMock response templating (e.g. presence serves a JS body verbatim). */
    templating?: boolean;
}

export const MOCK_WIREMOCK_CONFIGS: Record<string, MockWiremockConfig> = {
    capi: {
        name: "mock-capi",
        fixtureDir: "capi",
        aliases: [CAPI_HOSTNAME],
        ports: [WIREMOCK_HTTP_PORT],
        templating: true,
    },
    composer: {
        name: "mock-composer",
        fixtureDir: "composer",
        aliases: [COMPOSER_HOSTNAME],
        ports: [
            { container: WIREMOCK_HTTP_PORT, host: HOST_COMPOSER_HTTP_PORT },
            { container: WIREMOCK_HTTPS_PORT, host: HOST_COMPOSER_HTTPS_PORT },
        ],
        https: true,
        templating: true,
    },
    presence: {
        name: "mock-presence",
        fixtureDir: "presence",
        aliases: [PRESENCE_HOSTNAME],
        ports: [
            { container: WIREMOCK_HTTP_PORT, host: HOST_PRESENCE_HTTP_PORT },
            { container: WIREMOCK_HTTPS_PORT, host: HOST_PRESENCE_HTTPS_PORT },
        ],
        https: true,
    },
    telemetry: {
        name: "mock-telemetry",
        fixtureDir: "telemetry",
        aliases: [TELEMETRY_HOSTNAME],
        ports: [
            { container: WIREMOCK_HTTP_PORT, host: HOST_TELEMETRY_HTTP_PORT },
            { container: WIREMOCK_HTTPS_PORT, host: HOST_TELEMETRY_HTTPS_PORT },
        ],
        https: true,
        templating: true,
    },
    preferences: {
        name: "mock-preferences",
        fixtureDir: "preferences",
        aliases: [PREFERENCES_HOSTNAME],
        ports: [WIREMOCK_HTTP_PORT],
        templating: true,
    },
    tagmanager: {
        name: "mock-tagmanager",
        fixtureDir: "tagmanager",
        aliases: [TAG_MANAGER_HOSTNAME],
        ports: [WIREMOCK_HTTP_PORT],
        templating: true,
    },
};

// Start one WireMock mock from the shared image, bind-mounting fixtures/<name>
// as its stub root. Runs as root so WireMock can bind the privileged port 80,
// which the frontend's server-side calls reach via the network aliases.
export async function startMockWiremock(
    config: MockWiremockConfig,
    e2eRoot: string,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    const command = [
        "--root-dir",
        WIREMOCK_ROOT_DIR,
        "--port",
        String(WIREMOCK_HTTP_PORT),
        ...(config.https ? ["--https-port", String(WIREMOCK_HTTPS_PORT)] : []),
        "--verbose",
        ...(config.templating ? ["--local-response-templating"] : []),
    ];
    return new GenericContainer(WIREMOCK_IMAGE)
        .withUser("root")
        .withNetwork(network)
        .withNetworkAliases(...config.aliases)
        .withBindMounts([
            {
                source: path.join(e2eRoot, "fixtures", config.fixtureDir),
                target: WIREMOCK_ROOT_DIR,
                mode: "ro",
            },
        ])
        .withCommand(command)
        .withLogConsumer(createLogConsumer(config.name, streamLogs))
        .withExposedPorts(...config.ports)
        .withWaitStrategy(
            Wait.forHttp("/__admin/health", WIREMOCK_HTTP_PORT).forStatusCode(
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

export function buildDynamodbImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(e2eRoot, "images/dynamodb.Dockerfile", imageTag);
}

export async function startDynamodb(
    dynamodbImage: GenericContainer,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return dynamodbImage
        .withNetwork(network)
        .withNetworkAliases("workflow-e2e-dynamodb")
        .withLogConsumer(createLogConsumer("dynamodb", streamLogs))
        .withExposedPorts(8000)
        .withWaitStrategy(
            Wait.forLogMessage(/DynamoDB Local setup complete/, 1),
        )
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export function buildDatastoreImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    console.log(`process.env.WORKFLOW_BACKEND_DIR is ${process.env.WORKFLOW_BACKEND_DIR ?? "(not set)"}`);
    const datastoreContext =
        process.env.WORKFLOW_BACKEND_DIR ??
        path.join(e2eRoot, "target/workflow-backend");
    // fromDockerfile requires the Dockerfile inside the build context; the
    // datastore Dockerfile is kept under images/, so copy it into the backend
    // checkout before building.
    fs.copyFileSync(
        path.join(e2eRoot, "images/datastore.Dockerfile"),
        path.join(datastoreContext, "datastore.Dockerfile"),
    );
    return buildImage(datastoreContext, "datastore.Dockerfile", imageTag);
}

export async function startDatastore(
    datastoreImage: GenericContainer,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return datastoreImage
        .withNetwork(network)
        .withNetworkAliases("workflow-backend.local.dev-gutools.co.uk")
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

export function buildWorkflowImage(
    repoRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(
        repoRoot,
        "e2e-tests/images/workflow-frontend.Dockerfile",
        imageTag,
    );
}

export async function startWorkflow(
    workflowImage: GenericContainer,
    repoRoot: string,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return workflowImage
        .withNetwork(network)
        .withNetworkAliases(FRONTEND_ALIAS)
        // Mount the sources live so `yarn build-dev` (webpack watch) and Play
        // dev-mode `run` pick up edits without an image rebuild. public is rw
        // because webpack writes its bundles into public/build.
        // common-lib is rw because Play dev-mode `run` writes its compiled classes 
        // into common-lib/target.
        .withBindMounts([
            { source: path.join(repoRoot, "app"), target: "/workflow-frontend/app", mode: "ro" },
            { source: path.join(repoRoot, "common-lib"), target: "/workflow-frontend/common-lib", mode: "rw" },
            { source: path.join(repoRoot, "conf"), target: "/workflow-frontend/conf", mode: "ro" },
            { source: path.join(repoRoot, "public"), target: "/workflow-frontend/public", mode: "rw" },
        ])
        .withEnvironment({
            AWS_ENDPOINT_URL_S3: "http://minio:9000",
            AWS_ENDPOINT_URL_DYNAMODB: "http://workflow-e2e-dynamodb:8000",
            AWS_ACCESS_KEY_ID: MINIO_ROOT_USER,
            AWS_SECRET_ACCESS_KEY: MINIO_ROOT_PASSWORD,
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
