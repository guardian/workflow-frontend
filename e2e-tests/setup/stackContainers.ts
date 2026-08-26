import path from "path";
import { spawn } from "child_process";
import { GenericContainer, Network, Wait } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";
import { createPanDomainCookie } from "./panDomainCookie";

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
    /** Set only when the host-browser auth endpoint is exposed (dev flow). */
    authContainer?: any;
    /** Host URL that sets the auth cookie and redirects to the app. */
    authUrl?: string;
    mockCapiContainer: any;
    /** Base URL of the Composer mock's admin API, for querying its request journal. */
    mockComposerApiUrl: string;
    mockComposerApiContainer: any;
    mockPresenceContainer: any;
    /** Base URL of the telemetry mock's admin API, for querying its request journal. */
    mockTelemetryApiUrl: string;
    mockTelemetryContainer: any;
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
const WIREMOCK_HTTP_PORT = 80;
// Fixed host port for the optional host-browser auth-cookie endpoint. Kept
// stable (and forwarded in the devcontainer) so it can be bookmarked.
const NGINX_PORT = 80;
const HOST_AUTH_PORT = 9090;
const CONTAINER_FRONTEND_PORT = 9090;
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
     * Front the stack with a container that sets the pan-domain auth cookie on
     * /cookie and proxies all other paths to the frontend container, so
     * the stack can be used from a browser on the host without the real OAuth
     * flow. Off by default so automated test runs don't bind the fixed host port.
     */
    exposeHostAuth?: boolean;
}

export async function startLocalStack(
    e2eRoot: string,
    options: StartLocalStackOptions = {},
): Promise<LocalStack> {
    const { streamLogs = false, exposeHostAuth = false } = options;
    const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const minioImageTag = `workflow-frontend-minio-e2e:${runId}`;
    const workflowImageTag = `workflow-frontend-app-e2e:${runId}`;
    const mockCapiImageTag = `workflow-frontend-mock-capi-e2e:${runId}`;
    const mockComposerImageTag = `workflow-frontend-mock-composer-e2e:${runId}`;
    const mockPresenceImageTag = `workflow-frontend-mock-presence-e2e:${runId}`;
    const mockTelemetryImageTag = `workflow-frontend-mock-telemetry-e2e:${runId}`;
    const mockPreferencesImageTag = `workflow-frontend-mock-preferences-e2e:${runId}`;
    const mockTagManagerImageTag = `workflow-frontend-mock-tagmanager-e2e:${runId}`;
    const dynamodbImageTag = `workflow-frontend-dynamodb-e2e:${runId}`;
    const datastoreImageTag = `workflow-datastore-e2e:${runId}`;
    const authRedirectImageTag = `workflow-frontend-auth-redirect-e2e:${runId}`;

    const network = await new Network().start();

    let authContainer;
    let minioContainer;
    let workflowContainer;
    let mockCapiContainer;
    let mockComposerApiContainer;
    let mockPresenceContainer;
    let mockTelemetryContainer;
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
            .withExposedPorts(WIREMOCK_HTTP_PORT)
            .withWaitStrategy(
                Wait.forHttp("/__admin/health", WIREMOCK_HTTP_PORT).forStatusCode(
                    200,
                ),
            )
            .withStartupTimeout(2 * 60 * 1000)
            .start();

        const mockCapiUrl = `http://${mockCapiContainer.getHost()}:${mockCapiContainer.getMappedPort(WIREMOCK_HTTP_PORT)}`;

        await buildDockerImage({
            tag: mockComposerImageTag,
            dockerfilePath: path.join(
                e2eRoot,
                "images/mock-composer.Dockerfile",
            ),
            contextPath: e2eRoot,
        });

        mockComposerApiContainer = await new GenericContainer(mockComposerImageTag)
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

        const mockComposerApiUrl = `http://${mockComposerApiContainer.getHost()}:${mockComposerApiContainer.getMappedPort(WIREMOCK_HTTP_PORT)}`;

        await buildDockerImage({
            tag: mockPresenceImageTag,
            dockerfilePath: path.join(
                e2eRoot,
                "images/mock-presence.Dockerfile",
            ),
            contextPath: e2eRoot,
        });

        mockPresenceContainer = await new GenericContainer(mockPresenceImageTag)
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

        await buildDockerImage({
            tag: mockTelemetryImageTag,
            dockerfilePath: path.join(
                e2eRoot,
                "images/mock-telemetry.Dockerfile",
            ),
            contextPath: e2eRoot,
        });

        mockTelemetryContainer = await new GenericContainer(mockTelemetryImageTag)
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

        const mockTelemetryApiUrl = `http://${mockTelemetryContainer.getHost()}:${mockTelemetryContainer.getMappedPort(WIREMOCK_HTTP_PORT)}`;

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
            .withExposedPorts(WIREMOCK_HTTP_PORT)
            .withWaitStrategy(
                Wait.forHttp("/__admin/health", WIREMOCK_HTTP_PORT).forStatusCode(
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
            .withExposedPorts(WIREMOCK_HTTP_PORT)
            .withWaitStrategy(
                Wait.forHttp("/__admin/health", WIREMOCK_HTTP_PORT).forStatusCode(
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
            .withExposedPorts(9095)
            .withStartupTimeout(10 * 60 * 1000)
            .withWaitStrategy(
                 Wait.forHttp("/management/healthcheck", 9095).forStatusCode(200)
            )
            .start();

        // The Datastore applies its Play evolutions when it first serves a
        // request; its healthcheck above has done that, so the schema now exists:
        // load the section/desk test data into Postgres.
        await seedDatabase(dbContainer, e2eRoot);

        let authUrl: string | undefined;
        if (exposeHostAuth) {
            await buildDockerImage({
                tag: authRedirectImageTag,
                dockerfilePath: path.join(
                    e2eRoot,
                    "images/auth-redirect.Dockerfile",
                ),
                contextPath: e2eRoot,
            });

            // Long-lived so a dev session isn't re-authenticated hourly.
            const cookieValue = createPanDomainCookie(
                panDomainKeys.privateKeyPem,
                "default",
                12 * 60 * 60 * 1000,
            );

            authContainer = await new GenericContainer(authRedirectImageTag)
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

            authUrl = `https://workflow.local.dev-gutools.co.uk/e2e-stack-login`;
            console.log(`\n[auth-redirect] Host-browser auth endpoint available at ${authUrl}`);
        }
        
        const common = {
            panDomainPrivateKey: panDomainKeys.privateKeyPem,
            mockApiUrl: mockCapiUrl,
            mockComposerApiUrl,
            mockTelemetryApiUrl,
            minioContainer,
            mockCapiContainer,
            mockComposerApiContainer,
            mockPresenceContainer,
            mockTelemetryContainer,
            mockPreferencesApiContainer,
            mockTagManagerApiContainer,
            dbContainer,
            dynamodbContainer,
            datastoreContainer,
            authContainer,
            authUrl,
            network,
        };

        const repoRoot = path.join(e2eRoot, "..");
        await buildDockerImage({
            tag: workflowImageTag,
            dockerfilePath: path.join(
                e2eRoot,
                "images/workflow-frontend.Dockerfile",
            ),
            contextPath: repoRoot,
        });

        workflowContainer = await new GenericContainer(workflowImageTag)
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

        const baseUrl = `http://${workflowContainer.getHost()}:${workflowContainer.getMappedPort(CONTAINER_FRONTEND_PORT)}`;
        return { baseUrl, workflowContainer, ...common };
    } catch (error) {
        if (authContainer) {
            await authContainer.stop();
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
        if (mockComposerApiContainer) {
            await mockComposerApiContainer.stop();
        }
        if (mockPresenceContainer) {
            await mockPresenceContainer.stop();
        }
        if (mockTelemetryContainer) {
            await mockTelemetryContainer.stop();
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
    authContainer,
    minioContainer,
    mockCapiContainer,
    mockComposerApiContainer,
    mockPresenceContainer,
    mockTelemetryContainer,
    mockPreferencesApiContainer,
    mockTagManagerApiContainer,
    dbContainer,
    dynamodbContainer,
    datastoreContainer,
    network,
}: Partial<LocalStack> = {}): Promise<void> {
    if (authContainer) {
        await authContainer.stop();
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
    if (mockComposerApiContainer) {
        await mockComposerApiContainer.stop();
    }
    if (mockPresenceContainer) {
        await mockPresenceContainer.stop();
    }
    if (mockTelemetryContainer) {
        await mockTelemetryContainer.stop();
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
