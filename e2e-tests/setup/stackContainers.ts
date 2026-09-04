import path from "path";
import { Network } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";
import { createPanDomainCookie } from "./panDomainCookie";
import { seedDatabase } from "./stack/seedDatabase";
import {
    buildMinioImage,
    buildMockCapiImage,
    buildMockComposerImage,
    buildMockPresenceImage,
    buildMockTelemetryImage,
    buildMockPreferencesImage,
    buildMockTagManagerImage,
    buildDynamodbImage,
    buildDatastoreImage,
    buildAuthRedirectImage,
    buildWorkflowImage,
    startMinio,
    startMockCapi,
    startMockComposer,
    startMockPresence,
    startMockTelemetry,
    startMockPreferences,
    startMockTagManager,
    startDb,
    startDynamodb,
    startDatastore,
    startAuthRedirect,
    startWorkflow,
    WIREMOCK_HTTP_PORT,
    CONTAINER_FRONTEND_PORT,
} from "./stack/containers";

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

    const repoRoot = path.join(e2eRoot, "..");

    try {
        // Phase 1: kick off the two slow image builds (datastore and
        // workflow-frontend) up front so they run while the remaining images
        // build serially, then wait for them at the end.
        const datastoreImagePromise = buildDatastoreImage(
            e2eRoot,
            datastoreImageTag,
        );
        const workflowImagePromise = buildWorkflowImage(
            repoRoot,
            workflowImageTag,
        );

        const minioImage = await buildMinioImage(e2eRoot, minioImageTag);
        const mockCapiImage = await buildMockCapiImage(e2eRoot, mockCapiImageTag);
        const mockComposerImage = await buildMockComposerImage(
            e2eRoot,
            mockComposerImageTag,
        );
        const mockPresenceImage = await buildMockPresenceImage(
            e2eRoot,
            mockPresenceImageTag,
        );
        const mockTelemetryImage = await buildMockTelemetryImage(
            e2eRoot,
            mockTelemetryImageTag,
        );
        const mockPreferencesImage = await buildMockPreferencesImage(
            e2eRoot,
            mockPreferencesImageTag,
        );
        const mockTagManagerImage = await buildMockTagManagerImage(
            e2eRoot,
            mockTagManagerImageTag,
        );
        const dynamodbImage = await buildDynamodbImage(e2eRoot, dynamodbImageTag);
        const authRedirectImage = exposeHostAuth
            ? await buildAuthRedirectImage(e2eRoot, authRedirectImageTag)
            : undefined;

        const [datastoreImage, workflowImage] = await Promise.all([
            datastoreImagePromise,
            workflowImagePromise,
        ]);

        // Phase 2: start the containers serially in dependency order.
        minioContainer = await startMinio(
            minioImage,
            network,
            panDomainKeys,
            streamLogs,
        );

        mockCapiContainer = await startMockCapi(
            mockCapiImage,
            network,
            streamLogs,
        );
        const mockCapiUrl = `http://${mockCapiContainer.getHost()}:${mockCapiContainer.getMappedPort(WIREMOCK_HTTP_PORT)}`;

        mockComposerApiContainer = await startMockComposer(
            mockComposerImage,
            network,
            streamLogs,
        );
        const mockComposerApiUrl = `http://${mockComposerApiContainer.getHost()}:${mockComposerApiContainer.getMappedPort(WIREMOCK_HTTP_PORT)}`;

        mockPresenceContainer = await startMockPresence(
            mockPresenceImage,
            network,
            streamLogs,
        );

        mockTelemetryContainer = await startMockTelemetry(
            mockTelemetryImage,
            network,
            streamLogs,
        );
        const mockTelemetryApiUrl = `http://${mockTelemetryContainer.getHost()}:${mockTelemetryContainer.getMappedPort(WIREMOCK_HTTP_PORT)}`;

        mockPreferencesApiContainer = await startMockPreferences(
            mockPreferencesImage,
            network,
            streamLogs,
        );

        mockTagManagerApiContainer = await startMockTagManager(
            mockTagManagerImage,
            network,
            streamLogs,
        );

        dbContainer = await startDb(network, streamLogs);

        dynamodbContainer = await startDynamodb(
            dynamodbImage,
            network,
            streamLogs,
        );

        datastoreContainer = await startDatastore(
            datastoreImage,
            network,
            streamLogs,
        );

        // The Datastore applies its Play evolutions when it first serves a
        // request; its healthcheck above has done that, so the schema now exists:
        // load the section/desk test data into Postgres.
        await seedDatabase(dbContainer, e2eRoot);

        let authUrl: string | undefined;
        if (exposeHostAuth) {
            // Long-lived so a dev session isn't re-authenticated hourly.
            const cookieValue = createPanDomainCookie(
                panDomainKeys.privateKeyPem,
                "default",
                12 * 60 * 60 * 1000,
            );

            authContainer = await startAuthRedirect(
                authRedirectImage!,
                network,
                cookieValue,
                streamLogs,
            );

            authUrl = `https://workflow.local.dev-gutools.co.uk/cookie`;
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

        workflowContainer = await startWorkflow(
            workflowImage,
            repoRoot,
            network,
            streamLogs,
        );

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
