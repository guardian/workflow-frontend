# E2E test setup playbook

The single source of truth for the patterns and decisions behind a reference
end-to-end (e2e) test setup, so the same approach can be applied when building an
e2e suite for any project. Every skill under `.github/skills/e2e-*` and the
`e2e-test-setup` agent link back here. It captures the setup in three parts:

- The self-contained Testcontainers stack + Playwright/BDD suite.
- The GitHub Actions workflow that runs the suite in CI.
- The build-speed optimisations that keep CI fast.

This is a **reference for the patterns**, not a copy target. The essence of the
implementation is **captured in the docs beside this playbook** (`reference/*.md`),
linked throughout. When building an e2e suite elsewhere, apply the pattern and
adapt it to that project's stack — read the captured docs to see how it looks in
practice, don't clone them verbatim.

---

## 1. What the setup gives you

A browser-based e2e suite that runs entirely on one machine (dev container or CI
runner), with **no dependency on deployed infrastructure**:

- Tests written as Cucumber/Gherkin `.feature` files, run with Playwright via
  [`playwright-bdd`](https://github.com/vitalets/playwright-bdd).
- A **self-contained local stack** built with
  [Testcontainers](https://testcontainers.com/): the app under test plus its
  dependencies, each either mocked or (opt-in) run for real from source.
- The stack builds, seeds, runs and tears itself down from Playwright's
  `globalSetup`.

The design goal: *validate every change — including AI-authored ones — against a
realistic stack before it ships.*

**Guiding principles** (carry these into every setup):
1. Local development against the `dev` / `dev:local` environments must need **no
   special browser setup** — no forced cookies, no Playwright/browser mocks.
   Anything a test would otherwise inject client-side must instead be provided
   **server-side** (e.g. an nginx container that issues the auth cookie; mocks
   resolved via the Docker network), never in the browser or the test runner.
2. The code is always available at the **root of the dev container**. If a Docker
   image runs the app (CI / `test:ci`), it **bind-mounts the code externally**
   rather than copying it in.
3. **Run the app natively in dev, containerised only in CI.** In the dev container
   you run the app the normal way (`sbt run` / `yarn`, watch mode); only CI and
   `test:ci` wrap it in an image. See §9–§10.
4. **Intermediate files go in the build output folder, never in
   version-controlled source.** Anything generated while setting up or running the
   stack — checked-out source from another repo, the tiny build-context folders
   for the Datastore and Workflow frontend images, generated keys/config — is
   written under a build output folder (e.g. `target/`, gitignored), not into a
   version-controlled source folder. The reference does this already:
   `e2e-tests/target/workflow-backend/` (datastore checkout),
   `target/datastore-build-context` and `target/workflow-build-context` (image
   build contexts).

---

## 2. Architecture at a glance

```
Playwright (globalSetup)
   └─ startLocalStack()  ── Testcontainers (one Docker network per run)
        app-under-test (run from source)
          ├─ real service(s) run from source   ← opt-in per dependency
          ├─ WireMock ×N — mocked dependencies (one shared image)
          ├─ LocalStack (S3 + DynamoDB in ONE container)
          ├─ Postgres (only if a real service needs it)
          └─ nginx auth-redirect (optional, host-browser dev only)
```

**Real vs mocked dependencies (decide per dependency, confirm with the user).**
Every dependency the app talks to is either *mocked* with WireMock (the default)
or *run for real* from source. Running one for real is opt-in and makes sense
when it is a service version-controlled in a Guardian repository (private or
public) whose real behaviour you want to exercise (e.g. a datastore that owns its
schema and business logic). It costs a repo checkout and a source build, so
default to mocking and **confirm with the user** which Guardian-owned
dependencies warrant the real service. See §4.4.

Captured reference docs (essence of the implementation, in `reference/`):

- Stack orchestration, container recipes & network routing: [stack.md](stack.md).
- Seeding Postgres / DynamoDB / S3: [seeding.md](seeding.md).
- Pan-domain auth: [auth.md](auth.md).
- Toolchain-only Dockerfiles: [dockerfiles.md](dockerfiles.md).
- Playwright config & global setup: [playwright.md](playwright.md).
- Folder layout & package scripts: [scaffold.md](scaffold.md).
- e2e README / documentation: [docs.md](docs.md).
- CI workflow: [ci-workflow.md](ci-workflow.md).

---

## 3. The phased approach

Follow these phases in order when building an e2e suite. Each maps to a skill.
The reference setup went through these same phases.

| Phase | Goal | Skill |
|-------|------|-------|
| 0 | Discover the app's runtime dependencies (datastores, upstream APIs, auth) and decide, per private-repo dependency, whether to run it for real or mock it (confirm with the user) | (agent-led discovery) |
| 1 | Scaffold `e2e-tests/` (package.json, playwright.config, global-setup) | `e2e-stack-setup` |
| 2 | Build the Testcontainers stack: infra → app → real services + mocks (fast by design — see §6) | `e2e-stack-setup` |
| 3 | Seed fixtures and configure mocks | `e2e-fixtures-and-mocks` |
| 4 | Author a **small** set of `.feature` files + step definitions to validate the setup (ask the user which part of the UI to cover) | `feature-file-from-templates`, `feature-file-step-definitions` |
| 5 | Write the `e2e-tests/README.md` documenting the suite | (agent-led, see [docs.md](docs.md)) |
| 6 | Add the CI workflow | `e2e-ci-workflow` |

The `e2e-tests/README.md` is a **living document**: any later change to the e2e
setup (stack, fixtures/mocks, commands, folder layout or CI) must update the
matching section of the README in the same change, following [docs.md](docs.md).

---

## 4. Key architectural decisions (the "why")

These are the non-obvious choices that make the setup work. Carry these patterns
across when applying the approach elsewhere.

### 4.1 Toolchain-only images + bind-mounted source (CI) / native run (dev)
In local dev you run the app the normal way inside the dev container (`sbt run` /
`yarn`, watch mode) — no container. **CI and `test:ci`** run the app (and any
dependency run for real) as a container whose image bakes **only the toolchain**
(via `mise` reading `.tool-versions`); the code is **bind-mounted, never copied**
(guiding principle 2). See [dockerfiles.md](dockerfiles.md).
Consequences:
- Build context is a tiny temp dir holding just `.tool-versions` + the
  Dockerfile (`buildWorkflowImage` / `buildDatastoreImage`; see [stack.md](stack.md)).
  No repo copy.
- Source edits reload without an image rebuild — fast local iteration.
- Bind mounts are read-write because `sbt`/webpack write into `target/`.

### 4.2 One WireMock image for all mocks
Every mocked upstream runs from the **same** `wiremock/wiremock` image; only the
bind-mounted fixture root (`mappings/` + `__files/`) and command flags differ.
Driven by the `MOCK_WIREMOCK_CONFIGS` table + `startMockWiremock`. Adding a mock
= a new fixture folder + a table entry, no new Dockerfile. (This is the biggest
win here — see §6.)

### 4.3 One LocalStack container for S3 + DynamoDB
`startAws` runs a single `localstack/localstack:4` with `SERVICES: "s3,dynamodb"`.
Seed data is loaded from the host after start via `awslocal` (see
[seeding.md](seeding.md)) — no custom image.
- **S3 gotcha:** LocalStack only extracts the bucket from the Host header when it
  contains `.s3.`, so S3 endpoint/bucket network aliases must sit under an `s3.`
  domain (e.g. `permissions-cache.s3.localstack`) for virtual-hosted-style
  requests to resolve.

### 4.4 Running a dependency for real (opt-in, confirm per dependency)
Instead of mocking, a dependency can be run as the **actual service** when it is
a service version-controlled in a Guardian repository (private or public) whose
real behaviour matters. Check the repo out and build it as a toolchain-only,
bind-mounted container (§4.1), the same way as the app. Default to mocking with
WireMock and **confirm with the user** which Guardian-owned dependencies warrant
the real service — this is a per-dependency choice, not a fixed part of the
stack. (A private repo needs a checkout token in CI, see §5's skill; a public one
does not.)

In the reference setup the datastore is run this way: its backing Postgres starts
empty, the datastore's own migrations create the schema on first request (the
healthcheck triggers it), *then* CSV fixtures are loaded (see `seedDatabase`
ordering — parent tables before FK children).

### 4.5 Dual network routing (host browser vs Playwright Chromium)
The stack is reachable two ways (see the routing diagram in [stack.md](stack.md)):
1. **Host browser → nginx (TLS) → forwarded container ports.** Real
   `*.local.dev-gutools.co.uk` hostnames over HTTPS; local dev-nginx terminates
   TLS. Used for manual debugging via `yarn dev:local`.
2. **Playwright Chromium → services directly.** Chromium loads the app over
   plain HTTP on a forwarded port and reaches cross-origin HTTPS APIs via
   `--host-resolver-rules` mapping each hostname to the mock's fixed host port
   (`ignoreHTTPSErrors: true` accepts the self-signed certs). See `launchOptions`
   in [playwright.md](playwright.md).

Inside the Docker network, the frontend's **server-side** calls reach mocks by
registering the real upstream hostnames as **network aliases** on the mock
containers — no URL/config override needed.

Per guiding principle 1, the `dev` / `dev:local` environments resolve everything
server-side (Docker network aliases; nginx for TLS and cookies) and need no
browser setup; `--host-resolver-rules` is used **only by the headless Playwright
test run**, not for local dev.

### 4.6 Pan-domain auth without OAuth
A fresh RSA keypair is generated per run; the public/private keys are appended to
the pan-domain settings uploaded to S3, and tests sign a cookie with the private
key via the `signIn` fixture (see [auth.md](auth.md)). Roles map to emails that
must match entries in the permissions fixture (`permissions.json`).

For local dev the cookie is issued **server-side** by the nginx auth-redirect
container (§11), so browsing the app under `dev:local` needs no forced client
cookie; the `signIn` fixture signs one only for the headless test runs.

### 4.7 Minimal app-code change
The **only** production change was making the server use `http`
instead of `https` for internal API calls when an e2e env var is set. Keep the
app footprint this small; everything else lives under `e2e-tests/`.

### 4.8 Long-running stack reused across test runs
`dev:local` boots the stack once (app run natively, dependencies as containers)
and writes its connection details to a gitignored file; `test` reuses it (via
`sharedStack.ts` / `readSharedStackInfo`, `ACTIVE_STACK_FILE`) and **aborts if no
local stack is running**. `test:ci` instead builds and starts everything itself,
the app included as a container. See §9 for the full command set.

### 4.9 Share dependency caches with the host to avoid re-downloading
Fetching JVM/toolchain dependencies dominates cold-start time and can hit
"too many requests" rate limits from Maven Central. Two independent caches help,
and both are especially valuable when an AI agent runs the suite repeatedly:

- **Toolchain-installer cache (in-image, BuildKit):** mount the installer's cache
  dir as a BuildKit cache so `mise install` reuses it across image rebuilds:
  `RUN --mount=type=cache,target=/mise/cache,sharing=locked mise trust -a && mise install ...`
  (see [dockerfiles.md](dockerfiles.md)).
- **Dependency cache (bind-mount from host):** bind-mount the host's persistent
  coursier/ivy caches into each sbt container at `/root/.cache/coursier` and
  `/root/.ivy2`, read-write, so `sbt update`/`run` reuse artifacts already fetched
  instead of re-downloading. Resolve the host paths from env vars and add no
  mounts when they're unset, so it's a no-op outside the devcontainer (see
  `sbtCacheBindMounts` in [stack.md](stack.md)). In the Guardian devcontainer
  those paths come from the Scala module's `devenv-coursier-cache` /
  `devenv-ivy-cache` volumes, exposed as `DEVENV_COURSIER_CACHE_MOUNT_DIR` /
  `DEVENV_IVY_CACHE_MOUNT_DIR`.

---

## 5. Port map (reference stack)

Fixed host ports are only used where a stable port is required (host-browser
access / host-resolver-rules); everything else uses Testcontainers' random
mapped ports.

| Service | Container port | Fixed host port | Why fixed |
|---------|----------------|-----------------|-----------|
| app-under-test | 9090 | 9091 | host browser |
| auth-redirect (nginx) | 80 | 9090 | bookmarkable `/cookie` |
| Composer mock | 80 / 8443 | 9081 / 9082 | browser cross-origin https |
| Presence mock | 80 / 8443 | 9070 / 9071 | browser loads JS over https |
| Telemetry mock | 80 / 8443 | 3132 / 3133 | browser cross-origin https |
| CAPI / Preferences / TagManager mocks | 80 | random | server-side only |
| LocalStack (S3 + DynamoDB) | 4566 | random | seeded from host |
| Postgres | 5432 | random | seeded from host |
| Playwright UI | — | 9099 | `yarn test:ui` |
| Playwright report | — | 9098 | `yarn test:report` |

> **Mocking a service not listed here?** Find the port it uses for **local
> development** in that service's own repository (its dev run script / config) and
> mock it on that port.

---

## 6. Build-speed optimisations

Apply these **while building the stack** (Phase 2, `e2e-stack-setup`) rather than
as a separate pass — together they took CI from ~15 min to ~6 min.

1. **Start mocks from the WireMock image directly** (bind-mount fixtures) instead
   of building one image per mock.
2. **Consolidate S3 + DynamoDB** into a single LocalStack container.
3. **Minimise build context**: build toolchain-only images from a temp dir with
   just `.tool-versions` + the Dockerfile.
4. **Bind-mount source** instead of `COPY`ing it into the image.
5. **Drop the prebuild step** — with the above, few images are built and cached
   layers cover them.
6. **Overlap work**: build/start infra first, then the app, any real services and
   mocks concurrently (`Promise.all` phases in `startLocalStack`).
7. **CI: install only the Playwright headless shell** (`--only-shell`), not full
   Chromium.
8. **Persist the toolchain-installer cache across image builds** with a BuildKit
   cache mount, so re-running `mise install` doesn't re-download the toolchain:
   `RUN --mount=type=cache,target=/mise/cache,sharing=locked mise install ...`.
9. **Reuse a host dependency cache in the sbt containers**: bind-mount the
   devcontainer's persistent coursier/ivy caches into each JVM container (at
   `/root/.cache/coursier` and `/root/.ivy2`) so `sbt update`/`run` reuse Maven
   artifacts already on the host instead of re-downloading from Maven Central on
   every rebuild. Gate it on env vars so it's a no-op outside the devcontainer
   (see §4.9).
   (see §4.5).

---

## 7. Gotchas checklist

| Symptom | Cause / fix |
|---------|-------------|
| JDK fails to start in container | Alpine uses musl libc; Corretto/JDK need glibc → use `debian:bookworm-slim`. |
| `yarn` missing / engine mismatch | Pin Node in `.tool-versions`; enable via `corepack enable`. Node `22.5.1` is too old for some deps — use ≥ `22.9.0`. |
| Playwright deps missing in CI | `playwright install --with-deps chromium --only-shell`. |
| S3 requests hit wrong/no bucket | Bucket not under an `s3.` alias domain (see §4.3). |
| FK violation seeding DB | Seed parent tables before children (see `seedDatabase` order). |
| Cookie email has no permissions | Role email in `panDomainCookie.ts` has no matching entry in `permissions.json`. |
| Mock returns literal `{{...}}` | Response templating enabled where a verbatim body is needed — set `templating: false` (e.g. presence JS). |
| Containers rebuild every run | Expected on first run; BuildKit layer cache covers subsequent runs. Use `yarn dev:local` for a shared stack. |
| sbt re-downloads Maven artifacts every run / hits "too many requests" | Toolchain/dependency caches not shared — add the mise BuildKit cache mount and the coursier/ivy host bind-mounts (§4.9). |
| Arch mismatch (arm64 dev vs amd64 CI) | Pull arch-appropriate base images; avoid pinning a single-arch digest. |

---

## 8. Adapting to a non-Guardian / different stack

The **shape** is portable; the **specifics** are not. When the target project
differs:

- **Auth**: pan-domain is Guardian-specific. Replace §4.6 with the target's auth
  (JWT/session cookie/OIDC mock) but keep the "sign a token in a fixture, seed
  the verification key" pattern.
- **Upstreams**: enumerate the app's real HTTP dependencies (Phase 0) and add one
  WireMock fixture folder + `MOCK_WIREMOCK_CONFIGS` entry each.
- **Datastores**: keep only the LocalStack services / databases the app or a real
  service actually uses.
- **Real vs mocked dependencies**: decide per dependency whether to run the real
  service (private-repo checkout, built from source) or mock it with WireMock, and
  confirm with the user. If you run nothing for real, there is no private checkout
  and no GitHub App token in CI.

Guardian-specific detail for each phase lives in the **Guardian specifics**
section of each phase skill.

---

## 9. Commands (standard set)

| Command | What it does |
|---------|--------------|
| `test` | Run the suite headlessly to completion; non-zero exit on failure. Runs against an already-running local stack and **aborts if local infra isn't available**. |
| `test:ci` | Run the suite headlessly; spins up all infra **including the app under test in a container**. Used in CI. |
| `test:ui` | Open the Playwright UI (headed) to run tests on demand; spins up infra if not already running, in watch mode. |
| `dev:local` | Spin up the app (run **natively**, watch mode) and its dependencies, pointed at **local** infra (LocalStack, local permissions, mocks). |
| `dev` | Spin up the app (**natively**, watch mode) pointed at **remote** infra (e.g. AWS). |

`.feature` changes need a `bddgen` watch to regenerate tests; `.ts` step/test
changes are picked up automatically by the Playwright UI.

## 10. Modes & when to use them

| | Local dev against tests | Local agent dev against tests | Local dev running app | CI tests |
|---|---|---|---|---|
| Recompile on change | Y | Y | Y | N |
| Backing infra | Local | Local | Remote | Local |
| Run tests | Playwright UI | CLI | N/A | CLI |

- **Local dev against tests**: `dev:local` + `test:ui`; iterate with selector
  suggestions and browse the app at its real local hostname (dev-nginx on the
  host).
- **Local agent dev against tests**: an agent runs `test` (CLI). It should start
  `dev:local` if no local stack is running, and **abort if `dev` (remote infra)
  is running** so it never tests against remote infrastructure.
- **Local dev running app**: `dev` against remote infra; no tests.
- **CI**: `test:ci` builds and runs everything, app included, headless.

## 11. Supporting client-side needs server-side

Some behaviours a browser normally needs (e.g. an auth cookie) must — per guiding
principle 1 — be provided **server-side** so local dev needs no browser setup. The
reference does this with an **nginx container that issues the cookie** (scoped to
the subdomain) on a `/cookie` endpoint and redirects to the app, exposed to the
host via the host nginx mapping. Alternatives: a small service that issues the
cookie on an endpoint; a dev-only endpoint in login.gutools or the panda library.
Watch for an old cookie of the same name scoped to the **parent host** — it takes
precedence over the subdomain-scoped one.
