import path from "path";
import { spawn } from "child_process";
import { GenericContainer, Network, Wait } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";

const MINIO_ROOT_USER = "minioadmin";
const MINIO_ROOT_PASSWORD = "minioadmin";

type BuildDockerImageArgs = {
    tag: string;
    dockerfilePath: string;
    contextPath: string;
};

export type LocalStack = {
    baseUrl: string;
    panDomainPrivateKey: string;
    /**
     * Base URL of the configurable mock flexible-content API, mapped to the
     * host. POST to `${mockApiUrl}/__admin/state` to change what restore
     * destination/restore calls return at runtime.
     */
    mockApiUrl: string;
    minioContainer: any;
    workflowContainer: any;
    mockContainer: any;
    dbContainer: any;
    datastoreContainer: any;
    network: any;
};

// In local dev the restorer runs as the DEV identity, whose effective stage is
// CODE, so it resolves each stack's real per-stage flexible-content API host
// (see app/models/FlexibleStack.scala and app/config/AppConfig.scala). We
// register those exact hostnames as network aliases on the mock container, so
// the real hostnames resolve to the mock inside the Docker network — no
// config/URL override required.
const MOCK_API_PORT = 8080;
const MOCK_API_HOSTNAMES = [
    "iam-preview.content.local.dev-guardianapis.com",
];

function buildDockerImage({
    tag,
    dockerfilePath,
    contextPath,
}: BuildDockerImageArgs): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`\n[docker-build] Building ${tag} from ${dockerfilePath}`);
        const child = spawn(
            "docker",
            [
                "build",
                "--progress=plain",
                "-t",
                tag,
                "-f",
                dockerfilePath,
                contextPath,
            ],
            { stdio: "inherit" },
        );

        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) {
                console.log(`[docker-build] Finished ${tag}`);
                resolve();
            } else {
                reject(
                    new Error(
                        `docker build failed for ${tag} with exit code ${code}`,
                    ),
                );
            }
        });
    });
}

function createLogConsumer(prefix: string, streamLogs: boolean) {
    return (stream: any) => {
        if (!streamLogs) {
            // Discard container logs (default): they are only echoed to stdout
            // when the stack is run directly via `npm run local:stack`.
            return;
        }
        stream
            .on("data", (line: Buffer) => {
                process.stdout.write(`[${prefix}] ${line.toString()}`);
            })
            .on("err", (line: Buffer) => {
                process.stderr.write(`[${prefix}] ${line.toString()}`);
            });
    };
}

export interface StartLocalStackOptions {
    /**
     * Stream each container's logs to stdout/stderr. Useful when running the
     * stack directly (`npm run local:stack`) for debugging, but noisy when the
     * stack is started by the e2e global setup, so it defaults to off.
     */
    streamLogs?: boolean;
}

export async function startLocalStack(
    projectRoot: string,
    options: StartLocalStackOptions = {},
): Promise<LocalStack> {
    const { streamLogs = false } = options;
    const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const minioImageTag = `workflow-frontend-minio-e2e:${runId}`;
    const workflowImageTag = `workflow-frontend-app-e2e:${runId}`;
    const mockImageTag = `workflow-frontend-mock-api-e2e:${runId}`;
    const datastoreImageTag = `workflow-datastore-e2e:${runId}`;

    const network = await new Network().start();

    let minioContainer;
    let workflowContainer;
    let mockContainer;
    let dbContainer;
    let datastoreContainer;
    const panDomainKeys = generatePanDomainKeys();

    try {
        await buildDockerImage({
            tag: minioImageTag,
            dockerfilePath: path.join(projectRoot, "e2e/images/minio.Dockerfile"),
            contextPath: projectRoot,
        });

        minioContainer = await new GenericContainer(minioImageTag)
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
            .withStartupTimeout(2 * 60 * 1000)
            .start();

        await buildDockerImage({
            tag: mockImageTag,
            dockerfilePath: path.join(
                projectRoot,
                "e2e/images/mock-api.Dockerfile",
            ),
            contextPath: projectRoot,
        });

        mockContainer = await new GenericContainer(mockImageTag)
            .withNetwork(network)
            .withNetworkAliases(...MOCK_API_HOSTNAMES)
            .withLogConsumer(createLogConsumer("mock-api", streamLogs))
            .withExposedPorts(MOCK_API_PORT)
            .withWaitStrategy(
                Wait.forHttp("/__admin/health", MOCK_API_PORT).forStatusCode(
                    200,
                ),
            )
            .withStartupTimeout(2 * 60 * 1000)
            .start();

        const mockApiUrl = `http://${mockContainer.getHost()}:${mockContainer.getMappedPort(MOCK_API_PORT)}`;

        dbContainer = await new GenericContainer("postgres:17-alpine")
            .withName("workflow-db-e2e")
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

        await buildDockerImage({
            tag: datastoreImageTag,
            dockerfilePath: path.join(
                projectRoot,
                "e2e/images/datastore.Dockerfile",
            ),
            contextPath:
                process.env.WORKFLOW_BACKEND_DIR ??
                path.join(projectRoot, "target/workflow-backend"),
        });

        datastoreContainer = await new GenericContainer(datastoreImageTag)
            .withNetwork(network)
            .withNetworkAliases("workflow-backend.local.dev-gutools.co.uk")
            .withLogConsumer(createLogConsumer("datastore", streamLogs))
            .withExposedPorts(8080)
            .withStartupTimeout(10 * 60 * 1000)
            .withWaitStrategy(Wait.forListeningPorts())
            .start();

        await buildDockerImage({
            tag: workflowImageTag,
            dockerfilePath: path.join(
                projectRoot,
                "e2e/images/workflow-frontend.Dockerfile",
            ),
            contextPath: projectRoot,
        });

        workflowContainer = await new GenericContainer(workflowImageTag)
            .withNetwork(network)
            .withEnvironment({
                AWS_ENDPOINT_URL_S3: "http://minio:9000",
                AWS_ACCESS_KEY_ID: MINIO_ROOT_USER,
                AWS_SECRET_ACCESS_KEY: MINIO_ROOT_PASSWORD,
                // Keep local mode enabled in case scripts are bypassed in future changes.
                LOCAL: "true",
            })
            .withLogConsumer(createLogConsumer("workflow-frontend", streamLogs))
            .withExposedPorts(9090)
            .withStartupTimeout(10 * 60 * 1000)
            .withWaitStrategy(Wait.forListeningPorts())
            .start();

        const baseUrl = `http://${workflowContainer.getHost()}:${workflowContainer.getMappedPort(9090)}`;

        return {
            baseUrl,
            panDomainPrivateKey: panDomainKeys.privateKeyPem,
            mockApiUrl,
            minioContainer,
            workflowContainer,
            mockContainer,
            dbContainer,
            datastoreContainer,
            network,
        };
    } catch (error) {
        if (workflowContainer) {
            await workflowContainer.stop();
        }
        if (datastoreContainer) {
            await datastoreContainer.stop();
        }
        if (dbContainer) {
            await dbContainer.stop();
        }
        if (mockContainer) {
            await mockContainer.stop();
        }
        if (minioContainer) {
            await minioContainer.stop();
        }
        await network.stop();
        throw error;
    }
}

export async function stopLocalStack({
    workflowContainer,
    minioContainer,
    mockContainer,
    dbContainer,
    datastoreContainer,
    network,
}: Partial<LocalStack> = {}): Promise<void> {
    if (workflowContainer) {
        await workflowContainer.stop();
    }
    if (datastoreContainer) {
        await datastoreContainer.stop();
    }
    if (dbContainer) {
        await dbContainer.stop();
    }
    if (mockContainer) {
        await mockContainer.stop();
    }
    if (minioContainer) {
        await minioContainer.stop();
    }
    if (network) {
        await network.stop();
    }
}
