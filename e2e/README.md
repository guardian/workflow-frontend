# End-to-end tests

It contains the browser-based, end-to-end (e2e) test suite for
workflow-frontend. Tests are written as Cucumber/Gherkin `.feature` files and
run with [Playwright](https://playwright.dev/) via
[`playwright-bdd`](https://github.com/vitalets/playwright-bdd).

It builds a self-contained local stack in Docker to the
workflow-frontend service and the workflow datastore backend with a number of
of mocked upstream services. External APIs (i.e. external to Workflow) that are 
called by the frontend directly are mocked by Playwright's mocked API feature 
for higher flexibility. The whole end to end tests can run within a machine so
that it can be included as part of our CI workflow later.

For the design rationale behind the stack and the mocking boundaries, please see
[docs/containerised-bdd-test.md](../docs/containerised-bdd-test.md).

## Prerequisites

- **Docker** — must be installed and running. The stack is built and run as
  containers via [testcontainers](https://testcontainers.com/).
- **Node.js** — Tools version is managed by [mise](https://mise.jdx.dev/)
  (see [mise.toml](mise.toml)). `yarn install` installs the JS dependencies.
- **Git SSH access to `guardian/workflow`** — the Datastore backend is checked
  out and built from the [guardian/workflow](https://github.com/guardian/workflow)
  repository. The `test` script clones it automatically into
  `target/workflow-backend/` (see [scripts/checkout-datastore](scripts/checkout-datastore)).

Install dependencies and the Chromium browser once:

```bash
cd e2e
yarn install
yarn playwright install --with-deps chromium
```

## Running the tests

All commands are run from the `e2e/` folder.

```bash
yarn test
```

This generates the BDD test files (`bddgen`), ensures the Datastore backend is
checked out, builds the stack, and runs the test suite in headless mode. 

### Use host's browser to access Playwright UI

Headed mode is not supported in dev container, but you can run this command to
expose a port for a browser to access its Playwright UI.

```bash
yarn test:ui
```

The Playwright UI can be accessed via `http://localhost:9091/` on the host system.


### Fast inner loop with a shared stack

Building the stack on every run is slow. When iterating on tests,
start a long-running stack once and let subsequent test runs reuse it:

```bash
# Terminal 1 — boot the stack and leave it running (opens an authenticated browser)
yarn test:stack-only

# Terminal 2 — run tests repeatedly against the already-running stack
yarn test
```

The shared stack writes its connection details to a gitignored file that
`globalSetup.ts` picks up; when present, the test run skips building containers.
Press `Ctrl+C` in terminal 1 to tear the stack down.

### Viewing the report

After a run, open the HTML report (traces, videos and screenshots for failed
scenarios are attached):

```bash
yarn test:report
```

Raw artifacts are written to `target/test-results/` and the report to
`target/playwright-report/` (both gitignored). Traces/videos/screenshots are
captured on first retry and on failure — see `use` in
[playwright.config.ts](playwright.config.ts).

The test report is served via port 9090 which is mapped to the same port number
of the host. So you can open it by `http://localhost:9090` on your host directly.

## Folder structure

```
e2e/
├── features/          # Gherkin .feature files (one per behaviour area)
├── steps/             # Step definitions + Playwright fixtures wiring features to code
│   └── fixtures.ts    # Shared test fixtures (stack connection, signIn, mocks, world)
├── setup/             # Stack lifecycle + auth + mock helpers (not test steps)
│   ├── stackContainers.ts  # Builds/starts/stops the Docker stack via testcontainers
│   ├── sharedStack.ts      # Reuse a long-running stack across runs
│   ├── panDomainCookie.ts  # Signs pan-domain auth cookies for test roles
│   ├── panDomainKeys.ts    # Generates the pan-domain signing keypair
│   └── mock/               # Network-level mocks (Composer, telemetry, presence)
├── scripts/
│   ├── checkout-datastore  # Clones/updates guardian/workflow backend
│   └── docker/             # Stack entrypoints (run-local-stack, minio, dynamodb, x11vnc…)
├── images/            # Dockerfiles for each container in the stack
├── fixtures/          # Test data and config seeded into the stack
│   ├── conf/          # workflow-frontend + backend config for the local stack
│   ├── db/            # Postgres seed CSVs (sections, desks, stubs…)
│   ├── dynamodb/      # DynamoDB seed data (e.g. editorial support)
│   ├── permissions/   # Permission cache fixture (grants/denies workflow_access)
│   ├── pan-domain-settings/  # Pan-domain auth settings
│   ├── capi-mappings/        # WireMock stubs for CAPI preview
│   ├── preferences-mappings/ # WireMock stubs for the Preferences service
│   ├── tagmanager-mappings/  # WireMock stubs for Tag Manager
│   └── responses/            # Additional canned responses
├── globalSetup.ts     # Playwright global setup: start/reuse stack, write connection file
├── playwright.config.ts
├── mise.toml          # Pinned Node.js version
└── package.json       # Scripts and dev dependencies
```

## How a test run fits together

1. **`globalSetup.ts`** starts the stack (or reuses a shared one) and writes its
   base URL and pan-domain signing key to `target/tmp/e2e-active-stack.json`.
2. **`steps/fixtures.ts`** reads that file to point every test at the stack,
   provides a `signIn` helper (pan-domain cookie), a per-scenario `world`
   scratch space, and network mocks (`presence`, `telemetry`, `composerMock`).
3. **`bddgen`** turns the `.feature` files into runnable Playwright tests using
   the step definitions in `steps/`.
4. Playwright runs the scenarios against Chromium.

## Writing tests

- **`.feature` files** follow the workflow-frontend evidence-annotated Gherkin
  conventions. See
  [.github/instructions/feature-files.instructions.md](../.github/instructions/feature-files.instructions.md)
  and the `feature-file-from-templates` skill for authoring guidance.
- **Step definitions** live in `steps/*.steps.ts` and are wired to Playwright
  via `Given`/`When`/`Then` exported from `steps/fixtures.ts`. See the
  `feature-file-step-definitions` skill for how to add missing steps.
- **Auth**: use the `signIn` fixture. Roles map to emails in
  `setup/panDomainCookie.ts`, which must match entries in
  `fixtures/permissions/permissions.json`.
- **Mocking**: upstream services inside the stack are seeded via WireMock
  fixtures; browser-facing third parties (Composer, telemetry, presence) are
  mocked at the network layer under `setup/mock/`.
