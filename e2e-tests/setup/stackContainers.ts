import path from "path";
import { Network } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";
import { createPanDomainCookie } from "./panDomainCookie";
import { seedDatabase } from "./stack/seedDatabase";
import {
    buildMinioImage,
    buildDynamodbImage,
    buildDatastoreImage,
    buildWorkflowImage,
    startMinio,
    startMockWiremock,
    MOCK_WIREMOCK_CONFIGS,
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
    const dynamodbImageTag = `workflow-frontend-dynamodb-e2e:${runId}`;
    const datastoreImageTag = `workflow-datastore-e2e:${runId}`;

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
        // Build the images one at a time — concurrent buildkit builds are flaky
        // when resolving registry metadata — but start each container
        // asynchronously as soon as its image is ready and await the starts at
        // the end. Only one image ever builds at a time; container startups
        // overlap with subsequent builds.

        // Infrastructure first: everything else needs minio, dynamodb and
        // workflow-db, so wait for these to be up before starting the rest.
        const minioImage = await buildMinioImage(e2eRoot, minioImageTag);
        const minioStart = startMinio(minioImage, network, panDomainKeys, streamLogs);

        const dynamodbImage = await buildDynamodbImage(e2eRoot, dynamodbImageTag);
        const dynamodbStart = startDynamodb(dynamodbImage, network, streamLogs);

        // workflow-db has no image to build; start it straight away.
        const dbStart = startDb(network, streamLogs);

        [minioContainer, dynamodbContainer, dbContainer] = await Promise.all([
            minioStart,
            dynamodbStart,
            dbStart,
        ]);

        // With the infrastructure up, start workflow-frontend and the datastore
        // (which depend on it), then the remaining containers. Each container
        // starts while the next image builds.
        const workflowImage = await buildWorkflowImage(repoRoot, workflowImageTag);
        const workflowStart = startWorkflow(workflowImage, repoRoot, network, streamLogs);

        const datastoreImage = await buildDatastoreImage(e2eRoot, datastoreImageTag);
        const datastoreStart = startDatastore(datastoreImage, network, streamLogs);

        // The mocks all run from the shared WireMock image with no build step,
        // so their starts can be kicked off immediately.
        const mockCapiStart = startMockWiremock(MOCK_WIREMOCK_CONFIGS.capi, e2eRoot, network, streamLogs);
        const mockComposerStart = startMockWiremock(MOCK_WIREMOCK_CONFIGS.composer, e2eRoot, network, streamLogs);
        const mockPresenceStart = startMockWiremock(MOCK_WIREMOCK_CONFIGS.presence, e2eRoot, network, streamLogs);
        const mockTelemetryStart = startMockWiremock(MOCK_WIREMOCK_CONFIGS.telemetry, e2eRoot, network, streamLogs);
        const mockPreferencesStart = startMockWiremock(MOCK_WIREMOCK_CONFIGS.preferences, e2eRoot, network, streamLogs);
        const mockTagManagerStart = startMockWiremock(MOCK_WIREMOCK_CONFIGS.tagmanager, e2eRoot, network, streamLogs);

        let authUrl: string | undefined;
        let authStart: Promise<any> = Promise.resolve(undefined);
        if (exposeHostAuth) {
            // Long-lived so a dev session isn't re-authenticated hourly.
            const cookieValue = createPanDomainCookie(
                panDomainKeys.privateKeyPem,
                "default",
                12 * 60 * 60 * 1000,
            );
            authStart = startAuthRedirect(e2eRoot, network, cookieValue, streamLogs);
        }

        // Wait for the remaining containers to finish starting.
        [
            workflowContainer,
            datastoreContainer,
            mockCapiContainer,
            mockComposerApiContainer,
            mockPresenceContainer,
            mockTelemetryContainer,
            mockPreferencesApiContainer,
            mockTagManagerApiContainer,
            authContainer,
        ] = await Promise.all([
            workflowStart,
            datastoreStart,
            mockCapiStart,
            mockComposerStart,
            mockPresenceStart,
            mockTelemetryStart,
            mockPreferencesStart,
            mockTagManagerStart,
            authStart,
        ]);

        if (exposeHostAuth) {
            authUrl = `https://workflow.local.dev-gutools.co.uk/cookie`;
            console.log(`\n[auth-redirect] Host-browser auth endpoint available at ${authUrl}`);
        }

        // The Datastore applies its Play evolutions when it first serves a
        // request; its healthcheck above has done that, so the schema now exists:
        // load the section/desk test data into Postgres.
        await seedDatabase(dbContainer, e2eRoot);

        const mockCapiUrl = `http://${mockCapiContainer.getHost()}:${mockCapiContainer.getMappedPort(WIREMOCK_HTTP_PORT)}`;
        const mockComposerApiUrl = `http://${mockComposerApiContainer.getHost()}:${mockComposerApiContainer.getMappedPort(WIREMOCK_HTTP_PORT)}`;
        const mockTelemetryApiUrl = `http://${mockTelemetryContainer.getHost()}:${mockTelemetryContainer.getMappedPort(WIREMOCK_HTTP_PORT)}`;

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

        const baseUrl = `http://${workflowContainer.getHost()}:${workflowContainer.getMappedPort(CONTAINER_FRONTEND_PORT)}`;
        return { baseUrl, workflowContainer, ...common };
    } catch (error) {
        console.error(`Exception occurred: ${error}`);
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
