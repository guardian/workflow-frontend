import { resolve } from "node:path";
import type { StartedTestContainer } from "testcontainers";
import { E2E_ROOT, DYNAMO_TABLE } from "../constants.js";

async function awslocal(container: StartedTestContainer, args: string[]): Promise<void> {
  const { exitCode, output } = await container.exec(["awslocal", ...args]);
  if (exitCode !== 0) {
    throw new Error(`awslocal ${args.join(" ")} failed (${exitCode}):\n${output}`);
  }
}

/** Create the editorial-support table and load its fixture rows. */
export async function seedDynamodb(localstack: StartedTestContainer): Promise<void> {
  await localstack.copyFilesToContainer([
    {
      source: resolve(E2E_ROOT, `fixtures/dynamodb/${DYNAMO_TABLE}.json`),
      target: `/tmp/${DYNAMO_TABLE}.json`,
    },
  ]);

  await awslocal(localstack, [
    "dynamodb",
    "create-table",
    "--table-name",
    DYNAMO_TABLE,
    "--attribute-definitions",
    "AttributeName=id,AttributeType=S",
    "--key-schema",
    "AttributeName=id,KeyType=HASH",
    "--billing-mode",
    "PAY_PER_REQUEST",
  ]);

  await awslocal(localstack, [
    "dynamodb",
    "batch-write-item",
    "--request-items",
    `file:///tmp/${DYNAMO_TABLE}.json`,
  ]);
}
