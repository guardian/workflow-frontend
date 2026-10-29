import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

async function verifyChromium() {
    const browser = await chromium.launch();
    await browser.close();
}

async function main() {
    try {
        await verifyChromium();
    } catch (error) {
        console.warn(
            "Chromium verification failed. Installing system dependencies and retrying once.",
            error,
        );

        execFileSync("yarn", ["playwright", "install-deps", "chromium"], {
            stdio: "inherit",
        });
        await verifyChromium();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});