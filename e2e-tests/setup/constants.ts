import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the e2e-tests folder. */
export const E2E_ROOT = resolve(__dirname, "..");
/** Absolute path to the workflow-frontend repo root. */
export const REPO_ROOT = resolve(E2E_ROOT, "..");

/** Where the run-for-real datastore (guardian/workflow) is checked out. */
export const BACKEND_DIR =
  process.env.WORKFLOW_BACKEND_DIR ?? resolve(E2E_ROOT, "target/workflow-backend");

/** Stage the frontend runs as locally; drives the *.local.dev-gutools.co.uk domain. */
export const APP_DOMAIN = "local.dev-gutools.co.uk";

/** Docker image tags for the toolchain-only images built per run (CI / test:ci). */
export const APP_IMAGE_TAG = "workflow-frontend-e2e:latest";
export const DATASTORE_IMAGE_TAG = "workflow-datastore-e2e:latest";

/**
 * Network aliases = the real per-stage upstream hostnames. Registering them on the
 * mock/datastore containers makes the frontend's server-side calls resolve inside
 * the Docker network with no config override.
 */
export const ALIASES = {
  app: "workflow-frontend",
  datastore: "workflow-datastore",
  // The datastore's application.e2e.conf points at this exact host for Postgres.
  db: "workflow-db-e2e.local.dev-gutools.co.uk",
  localstack: "localstack",
  composer: `composer.${APP_DOMAIN}`,
  presence: `presence.${APP_DOMAIN}`,
  telemetry: `user-telemetry.${APP_DOMAIN}`,
  preferences: `preferences.${APP_DOMAIN}`,
  tagmanager: `tagmanager.${APP_DOMAIN}`,
  capi: `capi-preview.${APP_DOMAIN}`,
  // S3 bucket aliases must sit under an `s3.` domain so LocalStack can extract the
  // bucket from the virtual-hosted-style Host header (needs `.s3.`).
  s3: "s3.localstack",
  s3PanDomain: `pan-domain-auth-settings.s3.localstack`,
  s3Permissions: `permissions-cache.s3.localstack`,
} as const;

/** Fixed host ports — only where a stable port is required (host browser / host-resolver-rules). */
export const HOST_PORTS = {
  app: 9091,
  authRedirect: 9090,
  composerHttps: 9082,
  presenceHttps: 9071,
  telemetryHttps: 3133,
  playwrightUi: 9099,
  playwrightReport: 9098,
} as const;

/** Container ports. */
export const CONTAINER_PORTS = {
  app: 9090,
  datastore: 9093,
  db: 5432,
  localstack: 4566,
  wiremockHttp: 80,
  wiremockHttps: 8443,
} as const;

/** Postgres credentials for the run-for-real datastore. */
export const DB = {
  user: "workflow",
  password: "workflow",
  database: "workflow",
} as const;

export const PAN_DOMAIN_BUCKET = "pan-domain-auth-settings";
export const PERMISSIONS_BUCKET = "permissions-cache";
/** Permissions client always reads the CODE key (frontend maps non-PROD -> CODE). */
export const PERMISSIONS_KEY = "CODE/permissions.json";
export const PAN_DOMAIN_SETTINGS_KEY = `${APP_DOMAIN}.settings`;

export const DYNAMO_TABLE = "editorial-support-CODE";
