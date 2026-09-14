import { Network } from "testcontainers";
import type { StartedTestContainer, StartedNetwork } from "testcontainers";
import { HOST_PORTS, APP_DOMAIN } from "./constants.js";
import { generatePanDomainKeys } from "./panDomainKeys.js";
import type { LocalStack } from "./types.js";
import {
  startAws,
  startDb,
  startDatastore,
  startWorkflow,
  startMockWiremock,
  MOCK_WIREMOCK_CONFIGS,
} from "./stack/containers.js";
import { seedS3 } from "./stack/seedS3.js";
import { seedDynamodb } from "./stack/seedDynamodb.js";
import { seedDatabase } from "./stack/seedDatabase.js";

export interface StartOptions {
  /** Build + run the frontend as a container (test:ci / dev:local). */
  runApp?: boolean;
  /** Stream container logs to stdout (useful for dev:local). */
  streamLogs?: boolean;
}

/**
 * Build and start the whole self-contained stack on one Docker network:
 * infra (Postgres + LocalStack) -> mocks + datastore + app (overlapped) -> seed.
 */
export async function startLocalStack(options: StartOptions = {}): Promise<LocalStack> {
  const { runApp = true, streamLogs = false } = options;
  const started: StartedTestContainer[] = [];
  const track = <T extends StartedTestContainer>(c: T): T => {
    started.push(c);
    return c;
  };

  const network: StartedNetwork = await new Network().start();
  const panDomainKeys = generatePanDomainKeys();

  try {
    // 1. Infrastructure first — everything depends on it.
    const [localstack, db] = await Promise.all([
      startAws(network, streamLogs).then(track),
      startDb(network, streamLogs).then(track),
    ]);

    // Seed S3 (permissions + pan-domain settings) and DynamoDB before the app boots.
    await Promise.all([seedS3(localstack, panDomainKeys), seedDynamodb(localstack)]);

    // 2. Mocks (shared image, no build), datastore and app — overlapped.
    const mockStarts = Object.values(MOCK_WIREMOCK_CONFIGS).map((cfg) =>
      startMockWiremock(cfg, network, streamLogs).then((c) => ({ name: cfg.name, container: track(c) })),
    );
    const datastoreStart = startDatastore(network, streamLogs).then(track);
    const appStart = runApp ? startWorkflow(network, streamLogs).then(track) : Promise.resolve(undefined);

    const [datastore, app, ...mocks] = await Promise.all([datastoreStart, appStart, ...mockStarts]);

    // 3. Seed the datastore's Postgres now that its migrations have created the schema.
    await seedDatabase(db);

    const mockAdminUrls: Record<string, string> = {};
    for (const m of mocks) {
      mockAdminUrls[m.name] = `http://localhost:${m.container.getMappedPort(80)}/__admin`;
    }

    const baseUrl = app
      ? `http://localhost:${app.getMappedPort(9090)}`
      : `http://localhost:${HOST_PORTS.app}`;

    return {
      network,
      containers: started,
      baseUrl,
      cookieDomain: APP_DOMAIN,
      panDomainPrivateKeyPem: panDomainKeys.privateKeyPem,
      mockAdminUrls,
    };
  } catch (err) {
    await stopContainers(started, network);
    throw err;
  }
}

export async function stopLocalStack(stack: LocalStack): Promise<void> {
  await stopContainers(stack.containers, stack.network);
}

async function stopContainers(
  containers: StartedTestContainer[],
  network: StartedNetwork,
): Promise<void> {
  for (const container of [...containers].reverse()) {
    await container.stop().catch(() => undefined);
  }
  await network.stop().catch(() => undefined);
}
