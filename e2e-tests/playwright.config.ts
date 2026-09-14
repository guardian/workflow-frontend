import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import { HOST_PORTS } from "./setup/constants.js";

const testDir = defineBddConfig({
  features: "features/**/*.feature",
  steps: "steps/**/*.ts",
});

export default defineConfig({
  testDir,
  globalSetup: "./global-setup.ts",
  outputDir: "target/test-results",
  fullyParallel: true,
  workers: 4, // all workers share one stack
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true, // accept the mocks' self-signed certs
    launchOptions: {
      args: [
        // Route the browser's cross-origin HTTPS calls to each mock's fixed host port.
        "--host-resolver-rules=" +
          [
            `MAP composer.local.dev-gutools.co.uk 127.0.0.1:${HOST_PORTS.composerHttps}`,
            `MAP presence.local.dev-gutools.co.uk 127.0.0.1:${HOST_PORTS.presenceHttps}`,
            `MAP user-telemetry.local.dev-gutools.co.uk 127.0.0.1:${HOST_PORTS.telemetryHttps}`,
          ].join(","),
      ],
    },
  },
  reporter: process.env.CI
    ? [["github"], ["html", { outputFolder: "target/playwright-report", open: "never" }]]
    : [
        ["list"],
        ["html", { outputFolder: "target/playwright-report", open: "never" }],
      ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
