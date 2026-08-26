import { defineConfig, devices } from "@playwright/test";
import { cucumberReporter, defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
    features: "features/**/*.feature",
    steps: "steps/**/*.ts",
});

export default defineConfig({
    testDir,
    globalSetup: "./global-setup.ts",
    outputDir: 'target/test-results',
    // A single local stack is shared across the run, and the mock datastore has
    // mutable state, so keep tests serial for deterministic results.
    fullyParallel: true,
    // All workers share a single local stack (one restorer instance). Its
    // destination lookups query each stack with a blocking 3s timeout, so too
    // many concurrent requests can starve its thread pool and make reachable
    // stacks look unavailable. Cap concurrency to keep the load it sees modest.
    workers: 4,
    // Retry once so an occasional load-induced flake (e.g. a destination lookup
    // timing out under contention) doesn't fail the whole run.
    retries: 1,
    // Building the containers happens in global setup; individual tests are quick.
    timeout: 60 * 1000,
    expect: { timeout: 10 * 1000 },
    use: {
        // baseURL is supplied per-test by the `stack` fixture in steps/fixtures.ts.
        trace: "on-first-retry",
        video: "on-first-retry",
        screenshot: "only-on-failure",
        // Composer and presence are mocked by WireMock containers (see
        // stackContainers.ts). Route the browser's cross-origin https calls to
        // them and accept their self-signed certificates.
        ignoreHTTPSErrors: true,
        launchOptions: {
            args: [
                "--host-resolver-rules=MAP composer.local.dev-gutools.co.uk 127.0.0.1:9081,MAP presence.local.dev-gutools.co.uk 127.0.0.1:9070",
            ],
        },
    },
    reporter: process.env.CI ? 
        [["github"]] :
        [
            ["list", { printFailuresInline: true }],
            ["html", { outputFolder: "target/playwright-report", open: "never" }],
        ],
    /* Configure projects for major browsers */
    projects: [
        {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
        },
    ],
});
