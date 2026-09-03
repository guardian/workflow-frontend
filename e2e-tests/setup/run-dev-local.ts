import { chromium, Page } from "@playwright/test";
import { createPanDomainCookie } from "./panDomainCookie";
import { startLocalStack, stopLocalStack } from "./stackContainers";
import { writeSharedStackInfo, clearSharedStackInfo } from "./sharedStack";
import { installPresenceMock } from "../steps/shared/presenceMock";

function waitForTerminationSignal(): Promise<void> {
    return new Promise((resolve) => {
        const resolveOnce = () => {
            process.off("SIGINT", resolveOnce);
            process.off("SIGTERM", resolveOnce);
            process.off("SIGHUP", resolveOnce);
            resolve();
        };

        process.once("SIGINT", resolveOnce);
        process.once("SIGTERM", resolveOnce);
        process.once("SIGHUP", resolveOnce);
    });
}

async function main() {
    const projectRoot = process.cwd();
    let stack: Awaited<ReturnType<typeof startLocalStack>> | undefined;
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

    try {
        stack = await startLocalStack(projectRoot, { 
            streamLogs: true,
            exposeHostAuth: true
        });

        // Publish the running stack's connection details so `playwright test`
        // can reuse this stack instead of booting fresh containers each run.
        writeSharedStackInfo(projectRoot, {
            baseUrl: stack.baseUrl,
            panDomainPrivateKey: stack.panDomainPrivateKey,
            mockApiUrl: stack.mockApiUrl,
            mockComposerApiUrl: stack.mockComposerApiUrl,
            mockTelemetryApiUrl: stack.mockTelemetryApiUrl,
        });

        console.log(`\nLocal stack started at ${stack.baseUrl}`);
        if (stack.authUrl) {
            console.log(
                `\nTo authenticate a browser on your host, open: ${stack.authUrl}\n` +
                    "It sets the auth cookie and redirects to the app.",
            );
        }

        console.log("Press Ctrl+C to stop.");
        process.stdin.resume();
        await waitForTerminationSignal();
    } finally {
        if (browser) {
            await browser.close();
        }
        process.stdin.pause();
        clearSharedStackInfo(projectRoot);
        await stopLocalStack(stack);
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
