import { startLocalStack, stopLocalStack } from "./stackContainers.js";
import { writeSharedStackInfo, clearSharedStackInfo } from "./sharedStack.js";
import type { LocalStack } from "./types.js";

/**
 * Boot a long-running local stack (app + deps as containers) for interactive dev.
 * `yarn test` reuses it via the shared-stack file. Ctrl-C tears it down.
 */
async function main(): Promise<void> {
  console.log("[dev:local] starting stack (this builds images on first run)...");
  const stack: LocalStack = await startLocalStack({ runApp: true, streamLogs: true });
  writeSharedStackInfo({
    baseUrl: stack.baseUrl,
    cookieDomain: stack.cookieDomain,
    panDomainPrivateKeyPem: stack.panDomainPrivateKeyPem,
    mockAdminUrls: stack.mockAdminUrls,
  });
  console.log(`\n[dev:local] stack ready. App: ${stack.baseUrl}`);
  console.log("[dev:local] run `yarn test` in another terminal. Ctrl-C to stop.\n");
  // Resume stdin so its ref'd handle holds the event loop open until a signal
  // (an unsettled promise and signal listeners alone don't keep the process alive).
  process.stdin.resume();

  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    console.log("\n[dev:local] shutting down...");
    clearSharedStackInfo();
    await stopLocalStack(stack);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  await new Promise(() => {}); // keep alive
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
