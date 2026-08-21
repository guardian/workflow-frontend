import path from "path";
import { spawn } from "child_process";
import { GenericContainer, Network, Wait } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";
import {
    startFrontend,
    stopFrontend,
    type FrontendProcess,
} from "./frontendProcess";
import { writeHostAliases, removeHostAliases } from "./hostAliases";

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
    /** Set only when the frontend runs as a container (CI path). */
    workflowContainer?: any;
    /** Set only when the frontend runs directly on the host (watch mode). */
    frontendProcess?: FrontendProcess;
    /** Whether this stack added a managed /etc/hosts block that needs removing. */
    hostsWritten?: boolean;
    mockCapiContainer: any;
    mockPreferencesApiContainer: any;
    mockTagManagerApiContainer: any;
    dbContainer: any;
    dynamodbContainer: any;
    datastoreContainer: any;
    network: any;
};

// In local dev the restorer runs as the DEV identity, whose effective stage is
// CODE, so it resolves each stack's real per-stage flexible-content API host
// (see app/models/FlexibleStack.scala and app/config/AppConfig.scala). We
// register those exact hostnames as network aliases on the mock container, so
// the real hostnames resolve to the mock inside the Docker network — no
// config/URL override required.
const WIREMOCK_PORT = 80;
const CAPI_HOSTNAME = "iam-preview.content.local.dev-guardianapis.com";
const PREFERENCES_HOSTNAME = "preferences.local.dev-gutools.co.uk";
const TAG_MANAGER_HOSTNAME = "tagmanager.local.dev-gutools.co.uk";

// Test data loaded into the Datastore's Postgres tables once the schema exists.
// Parent tables (section, desk) are seeded before the tables that reference
// them (section_desk_mapping, section_to_tag) to satisfy foreign keys. `stub`
// has no foreign key onto the seeded tables, so its order is not significant.
// Each CSV's column order matches the `columns` list below.
const DB_SEED_TABLES: { table: string; columns: string; file: string }[] = [
    { table: "section", columns: "pk,section", file: "section.csv" },
    { table: "desk", columns: "pk,desk", file: "desk.csv" },
    {
        table: "section_desk_mapping",
        columns: "section_id,desk_id,pk",
        file: "section-desk.csv",
    },
    {
        table: "section_to_tag",
        columns: "section_id,tag_id,pk",
        file: "section-tag.csv",
    },
    {
        table: "stub",
        columns:
            "pk,working_title,section,due,assign_to,composer_id,content_type,priority,needs_legal,note,prod_office,created_at,assign_to_email,wf_last_modified,trashed,commissioning_desks,path,last_modified,status,published,time_published,revision,storybundleid,activeinincopy,takendown,time_takendown,wordcount,embargoed_until,embargoed_indefinitely,scheduled_launch_date,optimised_for_web,optimised_for_web_changed,sensitive,legally_sensitive,headline,has_main_media,commentable,editor_id,commissioned_length,print_wordcount,last_modified_by,planned_publication_id,actual_publication_id,planned_book_id,actual_book_id,planned_book_section_id,actual_book_section_id,planned_newspaper_page_number,actual_newspaper_page_number,planned_newspaper_publication_date,actual_newspaper_publication_date,last_modified_in_print_by,status_in_print,needs_picture_desk,rights_syndication_aggregate,rights_developer_community,rights_subscription_databases,rights_reviewed,byline,missing_commissioned_length_reason,display_hint,intended_audience,tracking_tags",
        file: "stub.csv",
    },
];

const DB_SEED_FIXTURES_DIR = "fixtures/db";
const DB_CONNECTION_URL =
    "postgresql://workflow:workflow@localhost:5432/workflow";

/**
 * Seed the Datastore's Postgres tables with section/desk test data.
 *
 * Must be called after the Datastore container has started, because that is
 * when Play evolutions create the schema. The CSV fixtures are copied into the
 * database container and loaded with `\copy`, parent tables first so that the
 * foreign keys in `section_desk_mapping` resolve.
 */
async function seedDatabase(
    dbContainer: any,
    projectRoot: string,
): Promise<void> {
    await dbContainer.copyFilesToContainer(
        DB_SEED_TABLES.map(({ file }) => ({
            source: path.join(projectRoot, DB_SEED_FIXTURES_DIR, file),
            target: `/tmp/${file}`,
        })),
    );

    for (const { table, columns, file } of DB_SEED_TABLES) {
        const copyCommand = `\\copy ${table}(${columns}) from '/tmp/${file}' with (format csv, header true, null 'NULL', on_error ignore)`;
        const result = await dbContainer.exec([
            "psql",
            DB_CONNECTION_URL,
            "-v",
            "ON_ERROR_STOP=1",
            "-c",
            copyCommand,
        ]);

        if (result.exitCode !== 0) {
            throw new Error(
                `Failed to seed table "${table}" from ${file} (exit code ${result.exitCode}):\n${result.output}`,
            );
        }
    }
}

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
            // when the stack is run directly via `yarn test:stack-only`.
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
    /**
     * How to run the workflow-frontend app. "host" (default) runs it directly on
     * the host in watch mode; "container" builds and runs it as a container (used
     * by CI). Dependencies are containers either way.
     */
    frontend?: "container" | "host";
}

export async function startLocalStack(
    e2eRoot: string,
    options: StartLocalStackOptions = {},
): Promise<LocalStack> {
    const { streamLogs = false, frontend = "host" } = options;
    const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const minioImageTag = `workflow-frontend-minio-e2e:${runId}`;
    const workflowImageTag = `workflow-frontend-app-e2e:${runId}`;
    const mockCapiImageTag = `workflow-frontend-mock-capi-e2e:${runId}`;
    const mockPreferencesImageTag = `workflow-frontend-mock-preferences-e2e:${runId}`;
    const mockTagManagerImageTag = `workflow-frontend-mock-tagmanager-e2e:${runId}`;
    const dynamodbImageTag = `workflow-frontend-dynamodb-e2e:${runId}`;
    const datastoreImageTag = `workflow-datastore-e2e:${runId}`;

    const network = await new Network().start();

    let minioContainer;
    let workflowContainer;
    let frontendProcess: FrontendProcess | undefined;
    let hostsWritten = false;
    let mockCapiContainer;
    let mockPreferencesApiContainer;
    let mockTagManagerApiContainer;
    let dbContainer;
    let dynamodbContainer;
    let datastoreContainer;
    const panDomainKeys = generatePanDomainKeys();

    try {
        await buildDockerImage({
            tag: minioImageTag,
            dockerfilePath: path.join(e2eRoot, "images/minio.Dockerfile"),
            contextPath: e2eRoot,
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
            .withStartupTimeout(5 * 60 * 1000)
            .start();

        await buildDockerImage({
            tag: mockCapiImageTag,
            dockerfilePath: path.join(
                e2eRoot,
                "images/mock-capi.Dockerfile",
            ),
            contextPath: e2eRoot,
        });

        mockCapiContainer = await new GenericContainer(mockCapiImageTag)
            .withNetwork(network)
            .withNetworkAliases(CAPI_HOSTNAME)
            .withLogConsumer(createLogConsumer("mock-capi", streamLogs))
            .withExposedPorts(WIREMOCK_PORT)
            .withWaitStrategy(
                Wait.forHttp("/__admin/health", WIREMOCK_PORT).forStatusCode(
                    200,
                ),
            )
            .withStartupTimeout(2 * 60 * 1000)
            .start();

        const mockCapiUrl = `http://${mockCapiContainer.getHost()}:${mockCapiContainer.getMappedPort(WIREMOCK_PORT)}`;

        await buildDockerImage({
            tag: mockPreferencesImageTag,
            dockerfilePath: path.join(
                e2eRoot,
                "images/mock-preferences.Dockerfile",
            ),
            contextPath: e2eRoot,
        });

        mockPreferencesApiContainer = await new GenericContainer(mockPreferencesImageTag)
            .withNetwork(network)
            .withNetworkAliases(PREFERENCES_HOSTNAME)
            .withLogConsumer(createLogConsumer("mock-preferences", streamLogs))
            .withExposedPorts(WIREMOCK_PORT)
            .withWaitStrategy(
                Wait.forHttp("/__admin/health", WIREMOCK_PORT).forStatusCode(
                    200,
                ),
            )
            .withStartupTimeout(2 * 60 * 1000)
            .start();

        await buildDockerImage({
            tag: mockTagManagerImageTag,
            dockerfilePath: path.join(
                e2eRoot,
                "images/mock-tagmanager.Dockerfile",
            ),
            contextPath: e2eRoot,
        });

        mockTagManagerApiContainer = await new GenericContainer(mockTagManagerImageTag)
            .withNetwork(network)
            .withNetworkAliases(TAG_MANAGER_HOSTNAME)
            .withLogConsumer(createLogConsumer("mock-tagmanager", streamLogs))
            .withExposedPorts(WIREMOCK_PORT)
            .withWaitStrategy(
                Wait.forHttp("/__admin/health", WIREMOCK_PORT).forStatusCode(
                    200,
                ),
            )
            .withStartupTimeout(2 * 60 * 1000)
            .start();

        dbContainer = await new GenericContainer("postgres:17-alpine")
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
            tag: dynamodbImageTag,
            dockerfilePath: path.join(
                e2eRoot,
                "images/dynamodb.Dockerfile",
            ),
            contextPath: e2eRoot,
        });

        dynamodbContainer = await new GenericContainer(dynamodbImageTag)
            .withNetwork(network)
            .withNetworkAliases("workflow-e2e-dynamodb")
            .withLogConsumer(createLogConsumer("dynamodb", streamLogs))
            .withExposedPorts(8000)
            .withWaitStrategy(
                Wait.forLogMessage(/DynamoDB Local setup complete/, 1),
            )
            .withStartupTimeout(2 * 60 * 1000)
            .start();

        console.log(`process.env.WORKFLOW_BACKEND_DIR is ${process.env.WORKFLOW_BACKEND_DIR}`);
        await buildDockerImage({
            tag: datastoreImageTag,
            dockerfilePath: path.join(
                e2eRoot,
                "images/datastore.Dockerfile",
            ),
            contextPath:
                process.env.WORKFLOW_BACKEND_DIR ??
                path.join(e2eRoot, "target/workflow-backend"),
        });

        datastoreContainer = await new GenericContainer(datastoreImageTag)
            .withNetwork(network)
            .withNetworkAliases("workflow-backend.local.dev-gutools.co.uk")
            .withLogConsumer(createLogConsumer("datastore", streamLogs))
            .withExposedPorts(8080)
            .withStartupTimeout(10 * 60 * 1000)
            .withWaitStrategy(
                 Wait.forHttp("/management/healthcheck", 8080).forStatusCode(200)
            )
            .start();

        // The Datastore applies its Play evolutions when it first serves a
        // request; its healthcheck above has done that, so the schema now exists:
        // load the section/desk test data into Postgres.
        await seedDatabase(dbContainer, e2eRoot);

        const common = {
            panDomainPrivateKey: panDomainKeys.privateKeyPem,
            mockApiUrl: mockCapiUrl,
            minioContainer,
            mockCapiContainer,
            mockPreferencesApiContainer,
            mockTagManagerApiContainer,
            dbContainer,
            dynamodbContainer,
            datastoreContainer,
            network,
        };

        if (frontend === "container") {
            await buildDockerImage({
                tag: workflowImageTag,
                dockerfilePath: path.join(
                    e2eRoot,
                    "images/workflow-frontend.Dockerfile",
                ),
                contextPath: path.join(e2eRoot, ".."),
            });

            workflowContainer = await new GenericContainer(workflowImageTag)
                .withNetwork(network)
                .withEnvironment({
                    AWS_ENDPOINT_URL_S3: "http://minio:9000",
                    AWS_ENDPOINT_URL_DYNAMODB: "http://workflow-e2e-dynamodb:8000",
                    AWS_ACCESS_KEY_ID: MINIO_ROOT_USER,
                    AWS_SECRET_ACCESS_KEY: MINIO_ROOT_PASSWORD,
                    // Keep local mode enabled in case scripts are bypassed in future changes.
                    LOCAL: "true",
                })
                .withLogConsumer(createLogConsumer("workflow-frontend", streamLogs))
                .withExposedPorts(9090, 9091)
                .withStartupTimeout(10 * 60 * 1000)
                .withWaitStrategy(
                    Wait.forHttp("/management/healthcheck", 9090).forStatusCode(200)
                )
                .start();

            const baseUrl = `http://${workflowContainer.getHost()}:${workflowContainer.getMappedPort(9090)}`;

            return { baseUrl, workflowContainer, ...common };
        }

        // Host mode: run the Play app directly on the host in watch mode, and
        // point it at the containers by mapping their Docker-network hostnames to
        // the container bridge IPs in /etc/hosts. Both the JVM and the browser
        // then resolve them exactly as they would inside the Docker network, so
        // the app's config (and virtual-hosted S3 bucket addressing) is unchanged.
        const networkName = network.getName();
        writeHostAliases([
            {
                ip: minioContainer.getIpAddress(networkName),
                hostnames: [
                    "minio",
                    "permissions-cache.minio",
                    "pan-domain-auth-settings.minio",
                ],
            },
            {
                ip: mockCapiContainer.getIpAddress(networkName),
                hostnames: [CAPI_HOSTNAME],
            },
            {
                ip: mockPreferencesApiContainer.getIpAddress(networkName),
                hostnames: [PREFERENCES_HOSTNAME],
            },
            {
                ip: mockTagManagerApiContainer.getIpAddress(networkName),
                hostnames: [TAG_MANAGER_HOSTNAME],
            },
            {
                ip: datastoreContainer.getIpAddress(networkName),
                hostnames: ["workflow-backend.local.dev-gutools.co.uk"],
            },
            {
                ip: dynamodbContainer.getIpAddress(networkName),
                hostnames: ["workflow-e2e-dynamodb"],
            },
        ]);
        hostsWritten = true;
        console.log(`\n[/etc/hosts] updated with local stack container IPs for host-mode frontend`);

        frontendProcess = await startFrontend({
            repoRoot: path.join(e2eRoot, ".."),
            streamLogs,
            env: {
                AWS_ENDPOINT_URL_S3: "http://minio:9000",
                AWS_ENDPOINT_URL_DYNAMODB: "http://workflow-e2e-dynamodb:8000",
                AWS_ACCESS_KEY_ID: MINIO_ROOT_USER,
                AWS_SECRET_ACCESS_KEY: MINIO_ROOT_PASSWORD,
                LOCAL: "true",
            },
        });
        console.log(`\n[workflow-frontend] Start directly in watch mode`);

        return {
            baseUrl: `http://localhost:9090`,
            frontendProcess,
            hostsWritten,
            ...common,
        };
    } catch (error) {
        await stopFrontend(frontendProcess);
        if (hostsWritten) {
            try {
                removeHostAliases();
            } catch {
                // Best effort: leave cleanup to the next run's writeHostAliases.
            }
        }
        if (workflowContainer) {
            await workflowContainer.stop();
        }
        if (datastoreContainer) {
            await datastoreContainer.stop();
        }
        if (dynamodbContainer) {
            await dynamodbContainer.stop();
        }
        if (dbContainer) {
            await dbContainer.stop();
        }
        if (mockTagManagerApiContainer) {
            await mockTagManagerApiContainer.stop();
        }
        if (mockPreferencesApiContainer) {
            await mockPreferencesApiContainer.stop();
        }
        if (mockCapiContainer) {
            await mockCapiContainer.stop();
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
    frontendProcess,
    hostsWritten,
    minioContainer,
    mockCapiContainer,
    mockPreferencesApiContainer,
    mockTagManagerApiContainer,
    dbContainer,
    dynamodbContainer,
    datastoreContainer,
    network,
}: Partial<LocalStack> = {}): Promise<void> {
    await stopFrontend(frontendProcess);
    if (hostsWritten) {
        try {
            removeHostAliases();
        } catch {
            // Best effort: leave cleanup to the next run's writeHostAliases.
        }
    }
    if (workflowContainer) {
        await workflowContainer.stop();
    }
    if (datastoreContainer) {
        await datastoreContainer.stop();
    }
    if (dynamodbContainer) {
        await dynamodbContainer.stop();
    }
    if (dbContainer) {
        await dbContainer.stop();
    }
    if (mockTagManagerApiContainer) {
        await mockTagManagerApiContainer.stop();
    }
    if (mockPreferencesApiContainer) {
        await mockPreferencesApiContainer.stop();
    }
    if (mockCapiContainer) {
        await mockCapiContainer.stop();
    }
    if (minioContainer) {
        await minioContainer.stop();
    }
    if (network) {
        await network.stop();
    }
}
