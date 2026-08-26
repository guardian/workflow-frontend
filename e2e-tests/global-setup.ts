import type { FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";
import {
    startLocalStack,
    stopLocalStack,
    type LocalStack,
} from "./setup/stackContainers";
import { readSharedStackInfo, type SharedStackInfo } from "./setup/sharedStack";

/**
 * File the running stack's connection details are written to, so the per-test
 * fixtures (e2e/steps/fixtures.ts) can pick up the base URL and pan-domain
 * signing key without re-starting containers.
 */
export const ACTIVE_STACK_FILE = "target/tmp/e2e-active-stack.json";

// Only the stack we start ourselves is torn down; a stack shared via
// `npm run local:stack` is left running for the next test run.
let ownedStack: LocalStack | undefined;

async function globalSetup(_config: FullConfig) {
    const e2eRoot = __dirname;

    let connection: SharedStackInfo;
    const shared = readSharedStackInfo(e2eRoot);
    if (shared) {
        connection = shared;
    } else {
        ownedStack = await startLocalStack(e2eRoot);
        connection = {
            baseUrl: ownedStack.baseUrl,
            panDomainPrivateKey: ownedStack.panDomainPrivateKey,
            mockApiUrl: ownedStack.mockApiUrl,
            mockComposerApiUrl: ownedStack.mockComposerApiUrl,
            mockTelemetryApiUrl: ownedStack.mockTelemetryApiUrl,
        };
    }

    const filePath = path.join(e2eRoot, ACTIVE_STACK_FILE);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(connection, null, 2), "utf8");

    return async () => {
        fs.rmSync(filePath, { force: true });
        if (ownedStack) {
            await stopLocalStack(ownedStack);
            ownedStack = undefined;
        }
    };
}

export default globalSetup;
