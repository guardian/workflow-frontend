import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { StartedTestContainer } from "testcontainers";
import {
  E2E_ROOT,
  PAN_DOMAIN_BUCKET,
  PERMISSIONS_BUCKET,
  PERMISSIONS_KEY,
  PAN_DOMAIN_SETTINGS_KEY,
} from "../constants.js";
import type { PanDomainKeys } from "../panDomainKeys.js";

/** awslocal wrapper: talks to LocalStack's gateway inside the container. */
async function awslocal(container: StartedTestContainer, args: string[]): Promise<void> {
  const { exitCode, output } = await container.exec(["awslocal", ...args]);
  if (exitCode !== 0) {
    throw new Error(`awslocal ${args.join(" ")} failed (${exitCode}):\n${output}`);
  }
}

/**
 * Seed the two S3 objects the app reads on startup: the permissions cache and the
 * pan-domain settings (with the per-run signing keys appended).
 */
export async function seedS3(
  localstack: StartedTestContainer,
  keys: PanDomainKeys,
): Promise<void> {
  const permissions = readFileSync(
    resolve(E2E_ROOT, "fixtures/permissions/permissions.json"),
    "utf-8",
  );
  const settingsBase = readFileSync(
    resolve(E2E_ROOT, `fixtures/pan-domain-settings/${PAN_DOMAIN_SETTINGS_KEY}`),
    "utf-8",
  );

  const settings =
    settingsBase.trimEnd() +
    `\npublicKey=${keys.publicKeyBase64}` +
    `\nprivateKey=${keys.privateKeyBase64}\n`;
  const settingsPublic =
    settingsBase.trimEnd() + `\npublicKey=${keys.publicKeyBase64}\n`;

  await container_writeTmp(localstack, "/tmp/permissions.json", permissions);
  await container_writeTmp(localstack, "/tmp/pan-domain.settings", settings);
  await container_writeTmp(localstack, "/tmp/pan-domain.settings.public", settingsPublic);

  for (const bucket of [PERMISSIONS_BUCKET, PAN_DOMAIN_BUCKET]) {
    await awslocal(localstack, [
      "s3api",
      "create-bucket",
      "--bucket",
      bucket,
      "--create-bucket-configuration",
      "LocationConstraint=eu-west-1",
    ]);
  }

  await awslocal(localstack, [
    "s3",
    "cp",
    "/tmp/permissions.json",
    `s3://${PERMISSIONS_BUCKET}/${PERMISSIONS_KEY}`,
  ]);
  await awslocal(localstack, [
    "s3",
    "cp",
    "/tmp/pan-domain.settings",
    `s3://${PAN_DOMAIN_BUCKET}/${PAN_DOMAIN_SETTINGS_KEY}`,
  ]);
  await awslocal(localstack, [
    "s3",
    "cp",
    "/tmp/pan-domain.settings.public",
    `s3://${PAN_DOMAIN_BUCKET}/${PAN_DOMAIN_SETTINGS_KEY}.public`,
  ]);
}

async function container_writeTmp(
  container: StartedTestContainer,
  path: string,
  content: string,
): Promise<void> {
  await container.copyContentToContainer([{ content, target: path }]);
}
