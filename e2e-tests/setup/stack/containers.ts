import path from "path";
import fs from "fs";
import { GenericContainer, StartedNetwork, Wait } from "testcontainers";
import { buildImage, createLogConsumer } from "./dockerHelpers";
import type { PanDomainKeys } from "../panDomainKeys";

export const MINIO_ROOT_USER = "minioadmin";
export const MINIO_ROOT_PASSWORD = "minioadmin";

// In local dev the restorer runs as the DEV identity, whose effective stage is
// CODE, so it resolves each stack's real per-stage flexible-content API host
// (see app/models/FlexibleStack.scala and app/config/AppConfig.scala). We
// register those exact hostnames as network aliases on the mock container, so
// the real hostnames resolve to the mock inside the Docker network — no
// config/URL override required.
export const WIREMOCK_HTTP_PORT = 80;
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
const COMPOSER_HTTPS_PORT = 8443;
const HOST_COMPOSER_HTTP_PORT = 9081;
const HOST_COMPOSER_HTTPS_PORT = 9082;
const PRESENCE_HOSTNAME = "presence.local.dev-gutools.co.uk";
// Presence's client library is loaded by the browser over https; the mock serves
// it on this fixed host port, which Chromium host-resolver-rules maps
// PRESENCE_HOSTNAME to. Forwarded in the devcontainer as "Presence".
const PRESENCE_HTTPS_PORT = 8443;
const HOST_PRESENCE_HTTP_PORT = 9070;
const HOST_PRESENCE_HTTPS_PORT = 9071;
const TELEMETRY_HOSTNAME = "user-telemetry.local.dev-gutools.co.uk";
// Telemetry is called from the browser over https; the mock serves it on this
// fixed host port, which Chromium host-resolver-rules maps TELEMETRY_HOSTNAME
// to. Forwarded in the devcontainer as "User telemetry".
const TELEMETRY_HTTPS_PORT = 8443;
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

export function buildMockCapiImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(e2eRoot, "images/mock-capi.Dockerfile", imageTag);
}

export async function startMockCapi(
    mockCapiImage: GenericContainer,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return mockCapiImage
        .withNetwork(network)
        .withNetworkAliases(CAPI_HOSTNAME)
        .withLogConsumer(createLogConsumer("mock-capi", streamLogs))
        .withExposedPorts(WIREMOCK_HTTP_PORT)
        .withWaitStrategy(
            Wait.forHttp("/__admin/health", WIREMOCK_HTTP_PORT).forStatusCode(
                200,
            ),
        )
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export function buildMockComposerImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(e2eRoot, "images/mock-composer.Dockerfile", imageTag);
}

export async function startMockComposer(
    mockComposerImage: GenericContainer,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return mockComposerImage
        .withNetwork(network)
        .withNetworkAliases(COMPOSER_HOSTNAME)
        .withLogConsumer(createLogConsumer("mock-composer", streamLogs))
        .withExposedPorts(
            {
                container: WIREMOCK_HTTP_PORT,
                host: HOST_COMPOSER_HTTP_PORT,
            },
            {
                container: COMPOSER_HTTPS_PORT,
                host: HOST_COMPOSER_HTTPS_PORT,
            })
        .withWaitStrategy(
            Wait.forHttp("/__admin/health", WIREMOCK_HTTP_PORT).forStatusCode(
                200,
            ),
        )
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export function buildMockPresenceImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(e2eRoot, "images/mock-presence.Dockerfile", imageTag);
}

export async function startMockPresence(
    mockPresenceImage: GenericContainer,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return mockPresenceImage
        .withNetwork(network)
        .withNetworkAliases(PRESENCE_HOSTNAME)
        .withLogConsumer(createLogConsumer("mock-presence", streamLogs))
        .withExposedPorts(
            {
                container: WIREMOCK_HTTP_PORT,
                host: HOST_PRESENCE_HTTP_PORT,
            },
            {
                container: PRESENCE_HTTPS_PORT,
                host: HOST_PRESENCE_HTTPS_PORT,
            },
        )
        .withWaitStrategy(
            Wait.forHttp("/__admin/health", WIREMOCK_HTTP_PORT).forStatusCode(
                200,
            ),
        )
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export function buildMockTelemetryImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(e2eRoot, "images/mock-telemetry.Dockerfile", imageTag);
}

export async function startMockTelemetry(
    mockTelemetryImage: GenericContainer,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return mockTelemetryImage
        .withNetwork(network)
        .withNetworkAliases(TELEMETRY_HOSTNAME)
        .withLogConsumer(createLogConsumer("mock-telemetry", streamLogs))
        .withExposedPorts(
            {
                container: WIREMOCK_HTTP_PORT,
                host: HOST_TELEMETRY_HTTP_PORT,
            },
            {
                container: TELEMETRY_HTTPS_PORT,
                host: HOST_TELEMETRY_HTTPS_PORT,
            })
        .withWaitStrategy(
            Wait.forHttp("/__admin/health", WIREMOCK_HTTP_PORT).forStatusCode(
                200,
            ),
        )
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export function buildMockPreferencesImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(e2eRoot, "images/mock-preferences.Dockerfile", imageTag);
}

export async function startMockPreferences(
    mockPreferencesImage: GenericContainer,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return mockPreferencesImage
        .withNetwork(network)
        .withNetworkAliases(PREFERENCES_HOSTNAME)
        .withLogConsumer(createLogConsumer("mock-preferences", streamLogs))
        .withExposedPorts(WIREMOCK_HTTP_PORT)
        .withWaitStrategy(
            Wait.forHttp("/__admin/health", WIREMOCK_HTTP_PORT).forStatusCode(
                200,
            ),
        )
        .withStartupTimeout(2 * 60 * 1000)
        .start();
}

export function buildMockTagManagerImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(e2eRoot, "images/mock-tagmanager.Dockerfile", imageTag);
}

export async function startMockTagManager(
    mockTagManagerImage: GenericContainer,
    network: StartedNetwork,
    streamLogs: boolean,
): Promise<any> {
    return mockTagManagerImage
        .withNetwork(network)
        .withNetworkAliases(TAG_MANAGER_HOSTNAME)
        .withLogConsumer(createLogConsumer("mock-tagmanager", streamLogs))
        .withExposedPorts(WIREMOCK_HTTP_PORT)
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

export function buildAuthRedirectImage(
    e2eRoot: string,
    imageTag: string,
): Promise<GenericContainer> {
    return buildImage(e2eRoot, "images/auth-redirect.Dockerfile", imageTag);
}

export async function startAuthRedirect(
    authRedirectImage: GenericContainer,
    network: StartedNetwork,
    cookieValue: string,
    streamLogs: boolean,
): Promise<any> {
    return authRedirectImage
        .withNetwork(network)
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
