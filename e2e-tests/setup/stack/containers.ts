import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer, StartedNetwork } from "testcontainers";

type Environment = Record<string, string>;
import { resolve } from "node:path";
import {
  E2E_ROOT,
  REPO_ROOT,
  BACKEND_DIR,
  ALIASES,
  HOST_PORTS,
  CONTAINER_PORTS,
  DB,
  APP_IMAGE_TAG,
  DATASTORE_IMAGE_TAG,
} from "../constants.js";

const WIREMOCK_IMAGE = "wiremock/wiremock:3.9.1";
const POSTGRES_IMAGE = "postgres:16-alpine";
const LOCALSTACK_IMAGE = "localstack/localstack:4";
const NGINX_IMAGE = "nginx:alpine";

/** Stream a container's logs to stdout, prefixed — only when streamLogs is set. */
export function createLogConsumer(prefix: string, streamLogs: boolean) {
  return (stream: NodeJS.ReadableStream) => {
    if (!streamLogs) return;
    stream.on("data", (line) => process.stdout.write(`[${prefix}] ${line}`));
    stream.on("err", (line) => process.stderr.write(`[${prefix}] ${line}`));
  };
}

/** Build an image from a Dockerfile via Testcontainers; deleted on exit. */
export function buildImage(context: string, tag: string) {
  return GenericContainer.fromDockerfile(context)
    .withBuildkit()
    .build(tag, { deleteOnExit: true });
}

// ----------------------------------------------------------------------------
// Infrastructure
// ----------------------------------------------------------------------------

/** Postgres for the run-for-real datastore. Starts empty; datastore migrates it. */
export async function startDb(
  network: StartedNetwork,
  streamLogs: boolean,
): Promise<StartedTestContainer> {
  return new GenericContainer(POSTGRES_IMAGE)
    .withNetwork(network)
    .withNetworkAliases(ALIASES.db)
    .withEnvironment({
      POSTGRES_USER: DB.user,
      POSTGRES_PASSWORD: DB.password,
      POSTGRES_DB: DB.database,
    })
    .withExposedPorts(CONTAINER_PORTS.db)
    .withLogConsumer(createLogConsumer("postgres", streamLogs))
    .withWaitStrategy(
      Wait.forLogMessage(/database system is ready to accept connections/, 2),
    )
    .start();
}

/** One LocalStack container for S3 + DynamoDB. */
export async function startAws(
  network: StartedNetwork,
  streamLogs: boolean,
): Promise<StartedTestContainer> {
  return new GenericContainer(LOCALSTACK_IMAGE)
    .withNetwork(network)
    .withNetworkAliases(
      ALIASES.localstack,
      ALIASES.s3,
      ALIASES.s3PanDomain,
      ALIASES.s3Permissions,
    )
    .withEnvironment({ SERVICES: "s3,dynamodb", AWS_DEFAULT_REGION: "eu-west-1" })
    .withExposedPorts(CONTAINER_PORTS.localstack)
    .withLogConsumer(createLogConsumer("localstack", streamLogs))
    .withWaitStrategy(Wait.forLogMessage(/Ready\./, 1))
    .start();
}

// ----------------------------------------------------------------------------
// Mocked upstreams — one shared WireMock image
// ----------------------------------------------------------------------------

export interface MockConfig {
  name: string;
  fixtureDir: string;
  aliases: string[];
  /** Fixed host port for the browser to reach the mock over HTTPS (8443). */
  hostHttpsPort?: number;
  /** Enable WireMock response templating; false serves bodies verbatim. */
  templating: boolean;
}

export const MOCK_WIREMOCK_CONFIGS: Record<string, MockConfig> = {
  capi: {
    name: "capi",
    fixtureDir: "capi",
    aliases: [ALIASES.capi],
    templating: true,
  },
  composer: {
    name: "composer",
    fixtureDir: "composer",
    aliases: [ALIASES.composer],
    hostHttpsPort: HOST_PORTS.composerHttps,
    templating: true,
  },
  presence: {
    name: "presence",
    fixtureDir: "presence",
    aliases: [ALIASES.presence],
    hostHttpsPort: HOST_PORTS.presenceHttps,
    templating: false,
  },
  telemetry: {
    name: "telemetry",
    fixtureDir: "telemetry",
    aliases: [ALIASES.telemetry],
    hostHttpsPort: HOST_PORTS.telemetryHttps,
    templating: true,
  },
  preferences: {
    name: "preferences",
    fixtureDir: "preferences",
    aliases: [ALIASES.preferences],
    templating: true,
  },
  tagmanager: {
    name: "tagmanager",
    fixtureDir: "tagmanager",
    aliases: [ALIASES.tagmanager],
    templating: true,
  },
};

export async function startMockWiremock(
  config: MockConfig,
  network: StartedNetwork,
  streamLogs: boolean,
): Promise<StartedTestContainer> {
  const command = [
    "--root-dir",
    "/fixtures",
    "--port",
    String(CONTAINER_PORTS.wiremockHttp),
    "--https-port",
    String(CONTAINER_PORTS.wiremockHttps),
    "--disable-banner",
  ];
  if (config.templating) command.push("--global-response-templating");

  // Browser-facing mocks get fixed host ports (http = https-1) so host-resolver-rules
  // can reach them; server-side-only mocks use random mapped ports.
  const exposedPorts =
    config.hostHttpsPort !== undefined
      ? [
          { container: CONTAINER_PORTS.wiremockHttp, host: config.hostHttpsPort - 1 },
          { container: CONTAINER_PORTS.wiremockHttps, host: config.hostHttpsPort },
        ]
      : [CONTAINER_PORTS.wiremockHttp, CONTAINER_PORTS.wiremockHttps];

  return new GenericContainer(WIREMOCK_IMAGE)
    .withNetwork(network)
    .withNetworkAliases(...config.aliases)
    .withUser("root") // bind privileged port 80
    .withCopyDirectoriesToContainer([
      { source: resolve(E2E_ROOT, "fixtures", config.fixtureDir), target: "/fixtures" },
    ])
    .withCommand(command)
    .withExposedPorts(...exposedPorts)
    .withLogConsumer(createLogConsumer(config.name, streamLogs))
    .withWaitStrategy(
      Wait.forHttp("/__admin/health", CONTAINER_PORTS.wiremockHttp).forStatusCode(200),
    )
    .start();
}

// ----------------------------------------------------------------------------
// Run-for-real datastore (guardian/workflow) — toolchain image + bind mount
// ----------------------------------------------------------------------------

export async function startDatastore(
  network: StartedNetwork,
  streamLogs: boolean,
): Promise<StartedTestContainer> {
  const image = await buildImage(resolve(E2E_ROOT, "images/datastore"), DATASTORE_IMAGE_TAG);
  return image
    .withNetwork(network)
    .withNetworkAliases(ALIASES.datastore)
    .withBindMounts([{ source: BACKEND_DIR, target: "/workflow-backend", mode: "rw" }])
    .withEnvironment(datastoreEnvironment())
    .withExposedPorts(CONTAINER_PORTS.datastore)
    .withLogConsumer(createLogConsumer("datastore", streamLogs))
    .withStartupTimeout(900_000) // sbt resolves + compiles + applies evolutions on first start
    .withWaitStrategy(
      Wait.forHttp("/management/healthcheck", CONTAINER_PORTS.datastore).forStatusCode(200),
    )
    .start();
}

function datastoreEnvironment(): Environment {
  return {
    STAGE: "DEV",
    DB_URL: `jdbc:postgresql://${ALIASES.db}:5432/${DB.database}`,
    DB_USER: DB.user,
    DB_PASSWORD: DB.password,
    PLAY_APPLICATION_SECRET: "e2e-datastore-secret-not-a-real-secret-000000",
  };
}

// ----------------------------------------------------------------------------
// App under test (CI / test:ci only; run natively in dev)
// ----------------------------------------------------------------------------

export function appEnvironment(): Environment {
  return {
    STAGE: "DEV",
    WORKFLOW_E2E: "true", // switches internal upstreams to http (see Config.scala)
    APPLICATION_SECRET: "e2e-application-secret-not-a-real-secret-000000",
    WORKFLOW_SHARED_SECRET: "e2e-shared-secret",
    AWS_REGION: "eu-west-1",
    AWS_DEFAULT_REGION: "eu-west-1",
    AWS_ACCESS_KEY_ID: "test",
    AWS_SECRET_ACCESS_KEY: "test",
    AWS_EC2_METADATA_DISABLED: "true",
    AWS_ENDPOINT_URL_S3: `http://${ALIASES.s3}:${CONTAINER_PORTS.localstack}`,
    AWS_ENDPOINT_URL_DYNAMODB: `http://${ALIASES.localstack}:${CONTAINER_PORTS.localstack}`,
  };
}

export async function startWorkflow(
  network: StartedNetwork,
  streamLogs: boolean,
): Promise<StartedTestContainer> {
  const image = await buildImage(resolve(E2E_ROOT, "images/app"), APP_IMAGE_TAG);
  return image
    .withNetwork(network)
    .withNetworkAliases(ALIASES.app)
    .withBindMounts([{ source: REPO_ROOT, target: "/workflow-frontend", mode: "rw" }])
    .withEnvironment(appEnvironment())
    .withExposedPorts({ container: CONTAINER_PORTS.app, host: HOST_PORTS.app })
    .withLogConsumer(createLogConsumer("workflow-frontend", streamLogs))
    .withStartupTimeout(900_000)
    .withWaitStrategy(
      Wait.forHttp("/management/healthcheck", CONTAINER_PORTS.app).forStatusCode(200),
    )
    .start();
}

// ----------------------------------------------------------------------------
// Optional host-browser auth-redirect (dev:local only)
// ----------------------------------------------------------------------------

export async function startAuthRedirect(
  network: StartedNetwork,
  cookieValue: string,
  streamLogs: boolean,
): Promise<StartedTestContainer> {
  return new GenericContainer(NGINX_IMAGE)
    .withNetwork(network)
    .withCopyFilesToContainer([
      {
        source: resolve(E2E_ROOT, "fixtures/auth-redirect/auth-redirect.conf.template"),
        target: "/etc/nginx/templates/default.conf.template",
      },
    ])
    .withEnvironment({
      APP_UPSTREAM: `${ALIASES.app}:${CONTAINER_PORTS.app}`,
      COOKIE_VALUE: cookieValue,
    })
    .withExposedPorts({ container: 80, host: HOST_PORTS.authRedirect })
    .withLogConsumer(createLogConsumer("auth-redirect", streamLogs))
    .withWaitStrategy(Wait.forListeningPorts())
    .start();
}
