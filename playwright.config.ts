import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
    features: "e2e/features/**/*.feature",
    steps: "e2e/steps/**/*.ts",
});

export default defineConfig({
    testDir,
    globalSetup: "./e2e/globalSetup.ts",
    // A single local stack is shared across the run, and the mock datastore has
    // mutable state, so keep tests serial for deterministic results.
    fullyParallel: false,
    workers: 1,
    reporter: "list",
    // Building the containers happens in global setup; individual tests are quick.
    timeout: 60 * 1000,
    expect: { timeout: 10 * 1000 },
    use: {
        // baseURL is supplied per-test by the `stack` fixture in e2e/steps/fixtures.ts.
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
});
