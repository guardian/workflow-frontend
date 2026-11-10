import fs from "fs";
import path from "path";
import { Network, StartedTestContainer } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";
import { createPanDomainCookie } from "./panDomainCookie";
import { seedDatabase } from "./stack/seedDatabase";
import { seedS3 } from "./stack/seedS3";
import { seedDynamodb } from "./stack/seedDynamodb";
import { createStackDiagnostics, formatDuration, type StackDiagnostics } from "./stackDiagnostics";
import { createStackResources, settleAll } from "./stackLifecycle";
import { clearSharedStackInfo, writeSharedStackInfo } from "./sharedStack";
import {
    buildDatastoreImage,
    buildWorkflowImage,
    startAws,
    registerAwsAliases,
    startMockWiremock,
    MOCK_WIREMOCK_CONFIGS,
    startDb,
    startDatastore,
    startDevcontainerNginx,
    startAuthRedirect,
    startWorkflow,
    NGINX_PORT,
    WIREMOCK_HTTP_PORT,
    CONTAINER_FRONTEND_PORT,
    CAPI_HOSTNAME,
    COMPOSER_HOSTNAME,
    TELEMETRY_HOSTNAME,
} from "./stack/containers";

export type LocalStack = {
    baseUrl: string;
    panDomainPrivateKey: string;
    /** Host URL of the CAPI mock, including its WireMock admin API. */
    mockApiUrl: string;
    /** Host URL that sets the auth cookie and redirects to the app. */
    authUrl?: string;
    /** Base URL of the Composer mock's admin API, for querying its request journal. */
    mockComposerApiUrl: string;
    /** Base URL of the telemetry mock's admin API, for querying its request journal. */
    mockTelemetryApiUrl: string;
    stop(): Promise<void>;
};

export interface StartLocalStackOptions {
    signal?: AbortSignal;
    diagnostics?: StackDiagnostics;
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
    const { exposeHostAuth = false, signal } = options;
    const diagnostics = options.diagnostics ?? createStackDiagnostics(e2eRoot);
    const resources = createStackResources(diagnostics);
    let temporaryDirectory: string | undefined;
    let cleanup: Promise<void> | undefined;

    function stop(): Promise<void> {
        return cleanup ??= cleanupStack();
    }

    async function cleanupStack(): Promise<void> {
        const label = "cleanup".padEnd(24);
        const started = performance.now();
        let failures = 0;

        diagnostics.log(`${label} STARTED`);

        try {
            failures = await resources.stopAll();
        } catch (error) {
            failures++;
            diagnostics.error("cleanup:resources", error);
        } finally {
            await diagnostics.step("remove:metadata", async () => {
                clearSharedStackInfo(e2eRoot, diagnostics.runId);
            }).catch(() => { failures++; });

            const buildDirectory = temporaryDirectory;

            if (buildDirectory) {
                await diagnostics.step("remove:build-contexts", async () => {
                    fs.rmSync(buildDirectory, { recursive: true, force: true });
                }).catch(() => { failures++; });
            }

            diagnostics.flush();

            const duration = (performance.now() - started) / 1000;

            diagnostics.log(`${label} ${"DONE".padEnd(7)} [${formatDuration(duration)}] failures=${failures}`);
            diagnostics.log(`diagnostics retained: ${diagnostics.directory}`);
        }
    }

    return diagnostics.step("startup", async () => {
        signal?.throwIfAborted();
        const devcontainerNginxImageTag = `workflow-devcontainer-nginx-e2e:${diagnostics.runId}`;
        const temporaryRoot = path.join(e2eRoot, "target/tmp");
        fs.mkdirSync(temporaryRoot, { recursive: true });
        const buildDirectory = fs.mkdtempSync(path.join(temporaryRoot, "stack-"));
        temporaryDirectory = buildDirectory;
        const panDomainKeys = generatePanDomainKeys();
        diagnostics.addSecrets([panDomainKeys.privateKeyPem]);
        const network = await resources.startNetwork(() => new Network().start());
        signal?.throwIfAborted();

        async function provisionAws() {
            const awsContainer = await resources.startContainer("localstack", () => startAws({ network, diagnostics }));
            signal?.throwIfAborted();
            await settleAll([
                () => diagnostics.step("seed:s3", () => seedS3(awsContainer, e2eRoot, panDomainKeys)),
                () => diagnostics.step("seed:dynamodb", () => seedDynamodb(awsContainer, e2eRoot)),
            ]);
        }

        const [workflowImage, datastoreImage, dbContainer] = await settleAll([
            () => diagnostics.step("build:workflow", () => buildWorkflowImage({
                e2eRoot,
                buildContext: path.join(buildDirectory, "frontend"),
                diagnostics,
            })),
            () => diagnostics.step("build:datastore", () => buildDatastoreImage({
                e2eRoot,
                buildContext: path.join(buildDirectory, "datastore"),
                diagnostics,
            })),
            () => resources.startContainer("postgres", () => startDb({ network, diagnostics })),
            provisionAws,
        ]);

        signal?.throwIfAborted();

        const startMock = (key: string) => {
            const config = MOCK_WIREMOCK_CONFIGS[key];
            return resources.startContainer(config.name, () => startMockWiremock({ config, e2eRoot, network, diagnostics }));
        };
        const [
            workflowContainer,
            mockCapiContainer,
            mockComposerApiContainer,
            mockTelemetryContainer,
            devcontainerNginxContainer,
        ] = await settleAll([
            () => resources.startContainer("workflow", () => startWorkflow({ e2eRoot, image: workflowImage, network, diagnostics })),
            () => startMock("capi"),
            () => startMock("composer"),
            () => startMock("telemetry"),
            () => resources.startContainer("chekov", () => startDevcontainerNginx(e2eRoot, devcontainerNginxImageTag, network, diagnostics)),
            () => resources.startContainer("datastore", () => startDatastore({ e2eRoot, image: datastoreImage, network, diagnostics })),
            () => startMock("presence"),
            () => startMock("preferences"),
            () => startMock("tagmanager"),
        ]);
        signal?.throwIfAborted();

        // Datastore creates the schema during startup, so seed after it is ready.
        await diagnostics.step("seed:datastore", () => seedDatabase(dbContainer, e2eRoot));
        signal?.throwIfAborted();
        
        await diagnostics.step("register:aws-aliases", async () => registerAwsAliases(devcontainerNginxContainer));
        signal?.throwIfAborted();

        let authUrl: string | undefined;

        if (exposeHostAuth) {
            const cookieValue = createPanDomainCookie(
                panDomainKeys.privateKeyPem, "default", 12 * 60 * 60 * 1000,
            );

            diagnostics.addSecrets([cookieValue]);

            const authContainer = await resources.startContainer("auth-redirect", () =>
                startAuthRedirect({ e2eRoot, network, cookieValue, diagnostics }),
            );

            signal?.throwIfAborted();

            const cookieUrl = `http://${authContainer.getHost()}:${authContainer.getMappedPort(NGINX_PORT)}/cookie`;

            await diagnostics.step("check:cookie", async () => {
                const timeout = AbortSignal.timeout(10_000);
                const response = await fetch(cookieUrl, {
                    redirect: "manual",
                    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
                });

                await response.body?.cancel();

                if (response.status !== 302 || !response.headers.get("set-cookie")?.includes("gutoolsAuth-assym=")) {
                    throw new Error("Auth proxy cookie endpoint must set a pan-domain authentication cookie and return HTTP 302");
                }
            });
            authUrl = "https://workflow.local.dev-gutools.co.uk/cookie";
        }

        signal?.throwIfAborted();

        const baseUrl = "https://workflow.local.dev-gutools.co.uk";
        const connection = {
            baseUrl,
            panDomainPrivateKey: panDomainKeys.privateKeyPem,
            mockApiUrl: `https://${CAPI_HOSTNAME}.local.dev-gutools.co.uk`,
            mockComposerApiUrl: `https://${COMPOSER_HOSTNAME}.local.dev-gutools.co.uk`,
            mockTelemetryApiUrl: `https://${TELEMETRY_HOSTNAME}.local.dev-gutools.co.uk`,
        };

        await diagnostics.step("publish:stack", async () => writeSharedStackInfo(
            e2eRoot,
            { ...connection, runId: diagnostics.runId },
        ));
        diagnostics.log(`stack ready at ${baseUrl}`);

        return { ...connection, authUrl, stop };
    }).catch(async (error) => {
        await stop().catch((cleanupError) => diagnostics.error("cleanup:stack", cleanupError));
        throw error;
    });
}
