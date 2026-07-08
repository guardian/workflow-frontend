import { chromium } from "@playwright/test";
import { createPanDomainCookie } from "../../setup/panDomainCookie";
import { startLocalStack, stopLocalStack } from "../../setup/stackContainers";
import { writeSharedStackInfo, clearSharedStackInfo } from "../../setup/sharedStack";

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
        stack = await startLocalStack(projectRoot, { streamLogs: true });
        const cookieData = createPanDomainCookie(stack.panDomainPrivateKey);

        // Publish the running stack's connection details so `npm run test:e2e`
        // can reuse this stack instead of booting fresh containers each run.
        // writeSharedStackInfo(projectRoot, {
        //     baseUrl: stack.baseUrl,
        //     panDomainPrivateKey: stack.panDomainPrivateKey,
        //     mockApiUrl: stack.mockApiUrl,
        // });

        browser = await chromium.launch({
            headless: false,
            // Prevent Playwright from installing its own signal handlers that
            // force-kill the browser and call process.exit() on Ctrl+C. Those
            // handlers bypass the `finally` block below, leaving the Docker
            // containers running. We handle termination ourselves so the
            // cleanup (stopLocalStack) always runs and removes the containers.
            handleSIGINT: false,
            handleSIGTERM: false,
            handleSIGHUP: false,
        });
        const page = await browser.newPage();
        // await page.context().addCookies([
        //     {
        //         name: "gutoolsAuth-assym",
        //         value: cookieData,
        //         url: stack.baseUrl,
        //     },
        // ]);
        // await page.goto(stack.baseUrl, { waitUntil: "domcontentloaded" });
        
        console.log(`\nLocal stack started `);
        // console.log(`\nLocal stack started at ${stack.baseUrl}`);
        // console.log("Opened a browser with a local auth cookie.");
        // console.log(
        //     `Mock flexible-content API: ${stack.mockApiUrl} ` +
        //         `(POST ${stack.mockApiUrl}/__admin/state to change responses).`,
        // );

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
