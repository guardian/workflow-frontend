import path from "path";
import fs from "fs";
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

// Resolve the guardian/workflow backend checkout used as the source of the
// datastore build (.tool-versions) and its bind-mounted sources at runtime.
function getBackendDir(e2eRoot: string): string {
    return (
        process.env.WORKFLOW_BACKEND_DIR ??
        path.join(e2eRoot, "target/workflow-backend")
    );
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
    return buildImage(buildContext, "datastore.Dockerfile", imageTag);
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
        .withNetwork(network)
        .withNetworkAliases("workflow-backend.local.dev-gutools.co.uk")
        // Mount the whole backend checkout so sbt runs from source without
        // baking it into the image. Read-write because sbt writes target/ dirs.
        .withBindMounts([
            { source: backendDir, target: "/workflow-backend", mode: "rw" },
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
        .withNetwork(network)
        .withNetworkAliases(FRONTEND_ALIAS)
        // Mount the whole repo so webpack (build-dev watch) and Play dev-mode
        // run from source without an image rebuild. Read-write because sbt and
        // webpack write target/ and public/build into it.
        .withBindMounts([
            { source: repoRoot, target: "/workflow-frontend", mode: "rw" },
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
