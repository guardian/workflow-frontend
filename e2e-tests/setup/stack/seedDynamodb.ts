import path from "path";

// Editorial-support test data loaded into LocalStack's DynamoDB. Seeded and read
// in eu-west-1 (the app's region), so the table is visible to the frontend.
const TABLE_NAME = "editorial-support-CODE";
const FIXTURE = "fixtures/dynamodb/editorial-support-CODE.json";
const CONTAINER_FIXTURE = "/tmp/editorial-support-CODE.json";

/**
 * Seed LocalStack's DynamoDB with the editorial-support test data using the
 * bundled awslocal CLI. Must run after the container is ready; awslocal targets
 * the local gateway and inherits the container's eu-west-1 region.
 */
export async function seedDynamodb(
    awsContainer: any,
    projectRoot: string,
): Promise<void> {
    await awsContainer.copyFilesToContainer([
        { source: path.join(projectRoot, FIXTURE), target: CONTAINER_FIXTURE },
    ]);

    const createResult = await awsContainer.exec([
        "awslocal",
        "dynamodb",
        "create-table",
        "--table-name",
        TABLE_NAME,
        "--attribute-definitions",
        "AttributeName=id,AttributeType=S",
        "--key-schema",
        "AttributeName=id,KeyType=HASH",
        "--billing-mode",
        "PAY_PER_REQUEST",
    ]);
    if (createResult.exitCode !== 0) {
        throw new Error(
            `Failed to create DynamoDB table "${TABLE_NAME}" (exit code ${createResult.exitCode}):\n${createResult.output}`,
        );
    }

    const populateResult = await awsContainer.exec([
        "awslocal",
        "dynamodb",
        "batch-write-item",
        "--request-items",
        `file://${CONTAINER_FIXTURE}`,
    ]);
    if (populateResult.exitCode !== 0) {
        throw new Error(
            `Failed to populate DynamoDB table "${TABLE_NAME}" (exit code ${populateResult.exitCode}):\n${populateResult.output}`,
        );
    }
}
