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
            frontend: "container",
            exposeHostAuth: true
        });
        const cookieData = createPanDomainCookie(stack.panDomainPrivateKey);
        console.log(`Created a pan-domain cookie for the local stack - ${cookieData}`);

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

        browser = await chromium.launch({
            headless: true,
            // Prevent Playwright from installing its own signal handlers that
            // force-kill the browser and call process.exit() on Ctrl+C. Those
            // handlers bypass the `finally` block below, leaving the Docker
            // containers running. We handle termination ourselves so the
            // cleanup (stopLocalStack) always runs and removes the containers.
            handleSIGINT: false,
            handleSIGTERM: false,
            handleSIGHUP: false,
            // Route the browser's cross-origin Composer, presence and telemetry
            // https calls to their WireMock containers (see stackContainers.ts).
            args: [
                "--host-resolver-rules=MAP composer.local.dev-gutools.co.uk 127.0.0.1:9082,MAP presence.local.dev-gutools.co.uk 127.0.0.1:9071,MAP user-telemetry.local.dev-gutools.co.uk 127.0.0.1:3133",
            ],
        });
        const page = await browser.newPage({ ignoreHTTPSErrors: true });
        await installPresenceMock(page);
        await page.context().addCookies([
            {
                name: "gutoolsAuth-assym",
                value: cookieData,
                url: stack.baseUrl,
            },
        ]);
        await page.goto(stack.baseUrl, { waitUntil: "domcontentloaded" });
        
        console.log("Opened a browser with a local auth cookie.");
        console.log(
            `Mock workflow datastore API: ${stack.mockApiUrl}`
        );

        if (stack.authUrl) {
            console.log(
                `\nTo authenticate a browser on your host, open: ${stack.authUrl}\n` +
                    "It sets the auth cookie and redirects to the app.",
            );
        }

        // When PICK_LOCATOR is set, open the Playwright Inspector against this
        // already-authenticated page. Use its "Pick locator" tool to grab
        // selectors without re-doing auth. Click "Resume" in the Inspector to
        // return here; the stack and browser stay up until you press Ctrl+C.
        if (process.env.PICK_LOCATOR) {
            console.log(
                "PICK_LOCATOR set: opening Playwright Inspector. " +
                    'Use "Pick locator", then click "Resume" when done.',
            );
            await page.pause();
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
