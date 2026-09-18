---
name: e2e-stack-setup
description: 'Scaffold the e2e-tests folder and build a self-contained, fast-starting local stack with Testcontainers for end-to-end tests: infrastructure (Postgres, LocalStack S3/DynamoDB), the app-under-test (and any dependency you opt to run for real) as toolchain-only bind-mounted containers, mocked dependencies via a shared WireMock image, one Docker network, and Playwright global setup. Build-speed optimisations are baked in here (shared mock image, single infra container, minimal build context, overlapped startup) rather than in a separate pass. Use when setting up the Testcontainers stack, adding local containers for e2e tests, wiring Playwright global-setup to a container stack, or when the e2e stack / Playwright CI is slow to build.'
argument-hint: '<the app''s runtime dependencies discovered in Phase 0>'
---

# E2E stack setup

Scaffold `e2e-tests/` and build the Testcontainers-based local stack. This is
Phases 1–2 of the playbook. **Read
[../e2e-test-setup/reference/e2e-playbook.md](../e2e-test-setup/reference/e2e-playbook.md)
§2–§5 first** and use the captured [stack.md](../e2e-test-setup/reference/stack.md)
reference as a worked example of the patterns below — adapt them to the target
project rather than copying verbatim.

## Prerequisites
- Phase 0 discovery complete: dependencies enumerated, auth model known, and —
  for each Guardian-repo dependency (private or public) — a user-confirmed
  decision to run it for real or mock it; Docker present.

## Scaffold (Phase 1)

Create an `e2e-tests/` folder independent of the app's build, following the
pattern in the reference
[scaffold.md](../e2e-test-setup/reference/scaffold.md):

- **Match the app's JavaScript package manager** (playbook guiding principle 5):
  detect what the main project uses — npm, yarn or pnpm — and use that same
  manager for the `e2e-tests/` workspace (its scripts, `install`/`exec`, lockfile
  and CI cache). If the app uses none of those, default to **npm**. The reference
  shows `yarn`; substitute the app's manager throughout.
- `package.json` with dev deps: `@playwright/test`, `playwright`,
  `playwright-bdd`, `testcontainers`, `tsx`, plus any AWS SDK clients needed for
  seeding. Provide the **standard scripts** (playbook §9): `test` (runs against an
  already-running local stack; aborts if none), `test:ci` (spins up all infra +
  the app as a container), `test:ui` (Playwright UI, watch), `dev:local` (app as a
  container against local infra, watch) and `dev` (app as a container against
  remote infra, watch).
- `playwright.config.ts` — follow the pattern in
  [playwright.md](../e2e-test-setup/reference/playwright.md):
  `defineBddConfig({ features, steps })`, `globalSetup`, `fullyParallel`, capped
  `workers`, `retries: 1`, per-test `timeout` + `expect.timeout`, trace/video/
  screenshot on first-retry/failure, and `launchOptions.args` with
  `--host-resolver-rules` for any browser-facing HTTPS mocks
  (`ignoreHTTPSErrors: true`).
- `global-setup.ts` — follow the pattern in
  [playwright.md](../e2e-test-setup/reference/playwright.md): start (or
  reuse) the stack, write connection details to a gitignored file, tear down the
  owned stack in the returned teardown fn.
- Pin the toolchain in `.tool-versions` / `mise.toml` (Node ≥ 22.9.0; enable
  `corepack` when the app's manager is yarn or pnpm).

## Build the stack (Phase 2)

Follow the patterns captured in [stack.md](../e2e-test-setup/reference/stack.md)
(orchestration + per-container recipes).

1. **One network per run**: `const network = await new Network().start();`
   Wrap everything in try/catch that stops every started container + the network
   on failure (see `startLocalStack`).

2. **Infrastructure first** (everything depends on it): start datastores in
   parallel and `await` before the rest.
   - Databases: stock images (e.g. `postgres:17-alpine`) with a network alias.
   - Object store / NoSQL: one `localstack/localstack:4` container with
     `SERVICES` listing only what's used. Register S3 aliases under an `s3.`
     domain (see playbook §4.3). Wait on `Wait.forLogMessage(/Ready\./)`.

3. **Mocked upstreams**: use the shared-WireMock pattern (see the
   `e2e-fixtures-and-mocks` skill). Define a `MOCK_WIREMOCK_CONFIGS` table and a
   single `startMockWiremock(config, ...)`. Register each real upstream hostname
   as a **network alias** so the app's server-side calls resolve to the mock.

4. **App under test** — run it as a **toolchain-only image with bind-mounted
   source** in **every mode** (`dev` / `dev:local` and `test:ci` / CI); the
   container runs the app in watch mode so bind-mounted source edits reload live:
   - Build context = a fresh temp dir under the **build output folder** (e.g.
     `target/<image>-build-context`), never a version-controlled source folder,
     containing only `.tool-versions` + the Dockerfile (see `buildWorkflowImage` /
     `buildDatastoreImage`). Any intermediate file the stack produces — image
     build contexts, source checked out from another repository (e.g. under
     `target/`), generated keys/config — belongs under the gitignored build
     output folder, not the source tree (guiding principle 4). Never copy the
     repo into the image (guiding principle 2).
   - Base image `debian:bookworm-slim` (glibc — see playbook gotchas); install
     the toolchain with `mise`.
   - Bind-mount the whole repo read-write; run from source (dev-mode + asset
     watch) so edits reload without a rebuild.
   - Point the app at the mocked infra via env vars (e.g.
     `AWS_ENDPOINT_URL_S3`, `AWS_ENDPOINT_URL_DYNAMODB`). **Route every AWS
     service the app uses to the LocalStack container** — but note the
     `AWS_ENDPOINT_URL*` env vars are **only honoured by newer SDKs**; older ones
     (e.g. AWS Java SDK v1 / early v2) ignore them. When they don't work, drive
     the endpoint from **configuration the app already reads** (an e2e config
     file, an existing endpoint/stage setting) rather than hard-coding a dummy AWS
     client in the application code — keep app-code changes minimal (playbook §4.7),
     adding a small env-gated switch only if there's no config path. Use **dummy**
     credentials (`AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`) and a
     fixed region, and don't let any real profile/SSO/`AWS_PROFILE` credentials
     leak in — so a test run can never reach real AWS (playbook §4.3).
   - Health-check with `Wait.forHttp('/management/healthcheck', port)`.
   - **Running a real dependency is opt-in, decided per dependency** (playbook
     §4.4): do it only for a service in a Guardian repository (private or public)
     whose real behaviour matters, and **confirm with the user** first —
     otherwise mock it (see the `e2e-fixtures-and-mocks` skill). Each real service
     is checked out from its repo and built the same way as the app.

5. **Overlap**: start infra, then the app, any real services and mocks
   concurrently with `Promise.all` (see the phased `await`s in `startLocalStack`).

6. **Seed after the schema exists**: when a real service owns a database schema,
   its migrations run on first request (its healthcheck triggers them); seed that
   datastore only after (see the `e2e-fixtures-and-mocks` skill and
   `seedDatabase`).

7. **Return** a `LocalStack` object exposing `baseUrl`, the auth signing key, mock
   admin URLs and every container handle for teardown.

## Build fast (bake these in as you go)

Don't add a separate optimisation pass — the steps above are already the fast
path. Keep these properties, which took the reference CI from ~15 min to ~6 min
(playbook §6):

- **One shared WireMock image** for all mocks (step 3), never one image per mock
  — the single biggest saving.
- **One LocalStack container** for S3 + DynamoDB (step 2), not separate services.
- **Toolchain-only images from a tiny build context** + **bind-mounted source**
  (step 4): no repo `COPY`, so images rarely rebuild and BuildKit's layer cache
  covers subsequent runs.
- **Overlap** infra → app + real services + mocks with `Promise.all` (step 5).
- **No prebuild step**: with the above, few images are built, so a separate
  "prebuild images" step isn't worth it — leave it out.
- **CI installs the Playwright headless shell only** (`--only-shell`) — see the
  `e2e-ci-workflow` skill.
- **Cache dependency downloads** so repeated runs (common with AI agents) don't
  re-fetch from Maven Central (playbook §4.9): wrap `mise install` in a BuildKit
  cache mount (`--mount=type=cache,target=/mise/cache,sharing=locked`), and
  bind-mount the host's persistent coursier/ivy caches into every sbt container
  via an env-gated helper (`sbtCacheBindMounts`, see the Guardian specifics
  below).

Measure with `DEBUG=testcontainers:build` (`yarn dev:debug`) and confirm cached
layers are reused on a second run.

## Long-running stack & the test / test:ci split
`dev:local` boots the stack once (app and dependencies all as containers) and
writes connection info to a gitignored file; `test` reuses it via a
`sharedStack.ts` reader and **aborts if no local stack is running**. `test:ci`
instead builds and starts everything itself. In every case the app runs as a
bind-mounted, watch-mode container. Provide a `run-dev-local.ts` entrypoint for
`dev:local`.

## Verify

Run all three checks; every one must pass before the phase is done. In every
check, **watch the standard output/error of the stack containers and the app**
(build logs, app startup, request logs) for errors, stack traces or failed
healthchecks — a green exit isn't enough if the app is logging errors. Treat any
unexpected error in the logs as a failure to diagnose and fix before moving on
(e.g. a mock returning 404/500, a failed DB connection, a missing env var).

1. **Single-command run** — the suite spins up the whole stack itself, runs
   green, then tears everything down:
   ```bash
   yarn test:ci
   ```
   Confirm it builds infra + the app-under-test container, reaches the app's
   healthcheck, and exits `0` with all scenarios passing **and** with no errors
   in the container/app logs.

2. **Shared-stack run (two terminals)** — boot the stack once, then run the suite
   against it from a separate terminal; the tests must pass the same way:
   ```bash
   # Terminal 1 — boot the stack and leave it running
   yarn dev:local
   # Terminal 2 — run the suite against the already-running stack
   yarn test
   ```
   Confirm `yarn test` reuses the running stack (skips building containers) and
   exits `0` with all scenarios passing.

3. **Host-browser access** — while the shared stack from step 2 is still up,
   **validate the exact path/URL that opens the app's landing page from a browser
   on the host** and confirm it loads (authenticated, not an error/redirect
   loop): e.g. `https://workflow.local.dev-gutools.co.uk/cookie`, which sets the
   auth cookie and redirects to the dashboard. Verify the URL actually resolves
   and renders the landing page end-to-end — this proves the host →
   TLS-terminating nginx → forwarded-port path reaches the app in the stack — and
   check the app logs for errors while the page loads. Record the working URL so
   the README and the landing-page feature can reference it.

4. **AWS goes to LocalStack, not real AWS** — confirm the app's AWS traffic
   really hits the LocalStack container (playbook §4.3), so a run can never touch
   a real account. Check the seeded resources exist in LocalStack
   (`awslocal s3 ls`, `awslocal dynamodb list-tables` — or the equivalent against
   the container's `4566` endpoint) and that the app/LocalStack logs show the
   AWS calls resolving to LocalStack with **no** requests to `*.amazonaws.com`.
   Treat any real-AWS endpoint in the logs as a failure to fix.

Finally, tear the stack down (`Ctrl+C` in Terminal 1) and confirm all containers
and the network are stopped with no leaks (`docker ps`).

> **Keep the doc in sync:** if `e2e-tests/README.md` already exists, update its
> stack / ports / folder-structure sections to match any change made here (see
> the `e2e-test-setup` skill's docs reference).

## Guardian specifics

Guardian editorial-tools detail (Scala/Play apps behind pan-domain auth).

### Running the datastore for real (a private-repo dependency)
The datastore is the reference example of running a dependency for real (playbook
§4.4): it lives in the separate private `guardian/workflow` repo. Locally it's
cloned into `e2e-tests/target/workflow-backend/` by a checkout script (see
[stack.md](../e2e-test-setup/reference/stack.md)),
resolved via `WORKFLOW_BACKEND_DIR` or the default target path
(`getBackendDir`). In CI it's checked out with a GitHub App token — see the
"Guardian specifics" section of the `e2e-ci-workflow` skill.

### Toolchain via mise + `.tool-versions`
Both app and datastore images install `java`, `sbt`, `nodejs`, `aws-cli` via
`mise` from a copied `.tool-versions`, then `corepack enable` for `yarn`. Base
image is `debian:bookworm-slim` (Corretto/JDK need glibc, so **not** Alpine). See
[dockerfiles.md](../e2e-test-setup/reference/dockerfiles.md).

### Running from source
- Frontend: `yarn build-dev` (webpack watch) alongside Play dev-mode `run` (see
  `start-workflow-frontend`), repo bind-mounted read-write.
- Datastore: `sbt -Dconfig.file=datastore/conf/application.e2e.conf datastore/run 9095`,
  the checkout bind-mounted read-write.

### Sharing the coursier/ivy cache with the devcontainer
The devcontainer's Scala module keeps persistent `devenv-coursier-cache` /
`devenv-ivy-cache` volumes. Bind-mount them into every sbt container (app +
datastore) at `/root/.cache/coursier` and `/root/.ivy2` (read-write) so
artifacts aren't re-downloaded from Maven Central on each rebuild. Do it through
a small `sbtCacheBindMounts()` helper that reads
`DEVENV_COURSIER_CACHE_MOUNT_DIR` / `DEVENV_IVY_CACHE_MOUNT_DIR` and returns no
mounts when they're unset, so the stack still works outside the devcontainer.
Also cache the mise download dir in the Dockerfiles via a BuildKit cache mount
(`--mount=type=cache,target=/mise/cache,sharing=locked`). See
[stack.md](../e2e-test-setup/reference/stack.md) and
[dockerfiles.md](../e2e-test-setup/reference/dockerfiles.md).

### Pan-domain auth
- Generate a fresh RSA keypair per run
  ([panDomainKeys.ts](../e2e-test-setup/reference/auth.md)).
- Append the keys to the pan-domain settings uploaded to S3
  ([seedS3.ts](../e2e-test-setup/reference/seeding.md)).
- Tests sign a cookie with `@guardian/pan-domain-node`
  ([panDomainCookie.ts](../e2e-test-setup/reference/auth.md)); role emails
  must match `fixtures/permissions/permissions.json`.

### Network aliases / hostnames
Register the real per-stage upstream hostnames (e.g.
`composer.local.dev-gutools.co.uk`, the CAPI preview host) as network aliases on
the mock containers so the app's server-side calls resolve inside the Docker
network with no config override. Browser cross-origin HTTPS calls are mapped by
Chromium `--host-resolver-rules` to fixed host ports.

### Host-browser access (optional dev flow)
`startAuthRedirect` runs stock `nginx:alpine` with a bind-mounted config
template; it sets the pan-domain cookie on `/cookie` and proxies everything else
to the frontend, so a host browser can hit
`https://workflow.local.dev-gutools.co.uk/cookie` (dev-nginx terminates TLS).
Enabled only when `exposeHostAuth` is set (via `yarn dev:local`).
