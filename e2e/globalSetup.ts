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
    const e2eRoot = process.cwd();

    let connection: SharedStackInfo;
    const shared = readSharedStackInfo(e2eRoot);
    if (shared) {
        connection = shared;
    } else {
        const headed = _config.projects.some(proj => !proj.use.headless);
        ownedStack = await startLocalStack(e2eRoot, { headed });
        connection = {
            baseUrl: ownedStack.baseUrl,
            panDomainPrivateKey: ownedStack.panDomainPrivateKey,
            mockApiUrl: ownedStack.mockApiUrl,
        };
    }

    // For headed runs, point Chromium at the in-container X server. The X11/VNC
    // container binds display :0 to the fixed host port 6000, so DISPLAY is
    // constant regardless of which stack (owned or shared) is in use. Worker
    // processes are spawned after global setup and inherit this env var.
    process.env.DISPLAY = process.env.DISPLAY ?? shared?.x11vncDisplayPort ?? "localhost:0";
    if (ownedStack?.novncUrl) {
        console.log(
            `\nHeaded run: watch the browser at http://localhost:6080/vnc.html?autoconnect=1\n`,
        );
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
