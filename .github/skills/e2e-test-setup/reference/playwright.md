# Reference: Playwright config & global setup

Captured essence of `playwright.config.ts` and `global-setup.ts`.

## Playwright config

```ts
const testDir = defineBddConfig({ features: "features/**/*.feature", steps: "steps/**/*.ts" });

export default defineConfig({
  testDir,
  globalSetup: "./global-setup.ts",
  outputDir: "target/test-results",
  fullyParallel: true,
  workers: 4,          // cap concurrency: all workers share one stack
  retries: 1,          // absorb occasional load-induced flakes
  timeout: 60_000,     // per-test
  expect: { timeout: 10_000 },  // per-assertion
  use: {
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true,     // accept the mocks' self-signed certs
    launchOptions: {
      args: [
        // map each browser-facing HTTPS mock hostname to its fixed host port
        "--host-resolver-rules=MAP composer.local.dev-gutools.co.uk 127.0.0.1:9082," +
        "MAP presence.local.dev-gutools.co.uk 127.0.0.1:9071," +
        "MAP user-telemetry.local.dev-gutools.co.uk 127.0.0.1:3133",
      ],
    },
  },
  reporter: process.env.CI ? [["github"]]
    : [["list", { printFailuresInline: true }],
       ["html", { outputFolder: "target/playwright-report", open: "never" }]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

Key choices: BDD via `playwright-bdd` (`defineBddConfig` + `bddgen`); one shared
stack so workers are capped; `--host-resolver-rules` + `ignoreHTTPSErrors` route
the browser to the mocks (headless test runs only); `github` reporter in CI.

## Global setup

Start (or reuse) the stack once, write its connection details to a gitignored
file the per-test fixtures read, and tear the owned stack down afterwards. A stack
started separately by `dev:local` is left running (not owned).

```ts
async function globalSetup() {
  const shared = readSharedStackInfo(e2eRoot);        // from dev:local, if any
  const connection = shared ?? await startAndAdapt(); // else start our own
  writeFileSync(ACTIVE_STACK_FILE, JSON.stringify(connection));  // baseUrl, signing key, mock URLs
  return async () => {           // teardown
    rmSync(ACTIVE_STACK_FILE, { force: true });
    if (ownedStack) await stopLocalStack(ownedStack);
  };
}
```

The connection file carries `baseUrl`, the pan-domain signing key and the mock
admin URLs; the BDD fixtures (`steps/fixtures.ts`) read it to point every test at
the stack and provide `signIn` and mock helpers.
