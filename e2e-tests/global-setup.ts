import type { FullConfig } from "@playwright/test";
import { startLocalStack, stopLocalStack } from "./setup/stackContainers.js";
import {
  readSharedStackInfo,
  writeActiveStackInfo,
  clearActiveStackInfo,
} from "./setup/sharedStack.js";
import type { LocalStack } from "./setup/types.js";

/**
 * Reuse a stack started by `dev:local` if present; otherwise start our own
 * (test:ci) and tear it down afterwards. Writes the active connection file that
 * the per-test fixtures read.
 */
async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const shared = readSharedStackInfo();
  if (shared) {
    console.log("[global-setup] reusing dev:local stack");
    writeActiveStackInfo(shared);
    return async () => clearActiveStackInfo();
  }

  console.log("[global-setup] starting owned stack");
  const stack: LocalStack = await startLocalStack({ runApp: true, streamLogs: false });
  writeActiveStackInfo({
    baseUrl: stack.baseUrl,
    cookieDomain: stack.cookieDomain,
    panDomainPrivateKeyPem: stack.panDomainPrivateKeyPem,
    mockAdminUrls: stack.mockAdminUrls,
  });

  return async () => {
    clearActiveStackInfo();
    await stopLocalStack(stack);
  };
}

export default globalSetup;
