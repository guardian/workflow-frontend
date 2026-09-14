---
name: e2e-fixtures-and-mocks
description: 'Mock upstream HTTP services and seed test data for the e2e local stack: run every mock from one shared WireMock image with per-mock bind-mounted fixtures, and seed Postgres (CSV), DynamoDB and S3 (LocalStack) from the host after the containers start. Use when adding or changing a mocked upstream service, writing WireMock stubs, or seeding database/S3/DynamoDB fixtures for e2e tests.'
argument-hint: '<the upstream service to mock or the data to seed>'
---

# E2E fixtures and mocks

Phase 3 of the playbook: mock the app's upstream HTTP dependencies and seed the
test data the app reads. **Read
[../e2e-test-setup/reference/e2e-playbook.md](../e2e-test-setup/reference/e2e-playbook.md)
§4.2–§4.4 first** and use the captured [stack.md](../e2e-test-setup/reference/stack.md)
and [scaffold.md](../e2e-test-setup/reference/scaffold.md) references as worked
examples of the patterns below.

> **Server-side, not browser-side** (guiding principle 1): the `dev` / `dev:local`
> environments must work with no browser setup. Resolve mocks server-side (Docker
> network aliases; nginx for TLS and cookie issuing), not via browser
> `--host-resolver-rules` or client-injected cookies — those are only for the
> headless test run.

## Mocking upstreams — one shared WireMock image

Do **not** build a Dockerfile per mock. Run every mock from the same
`wiremock/wiremock` image, differing only by the bind-mounted fixture root and
command flags. Follow the pattern in `startMockWiremock` + `MOCK_WIREMOCK_CONFIGS` in
[stack.md](../e2e-test-setup/reference/stack.md).

To add a mock:
1. Create `fixtures/<service>/` containing WireMock `mappings/` (stub rules) and
   `__files/` (response bodies).
2. Add an entry to the `MOCK_WIREMOCK_CONFIGS` table:
   - `name` — log prefix.
   - `fixtureDir` — the `fixtures/<service>` folder.
   - `aliases` — the real upstream hostname(s) to register as Docker **network
     aliases** (so the app's server-side calls resolve to the mock).
   - `ports` — expose `80`; add a fixed host port + `https: true` (port `8443`)
     only when the browser calls it cross-origin. If the service isn't in the
     reference port map (playbook §5), find the port it uses for **local
     development** in that service's own repository (its dev run script / config)
     and mock it on that port.
   - `templating` — `true` to enable WireMock response templating; set `false`
     when a body must be served verbatim (e.g. a JS library).
3. Kick off its start in the mocks `Promise.all` batch in `startLocalStack`.
4. If the browser reaches it over HTTPS, add a `--host-resolver-rules` mapping in
   [playwright.config.ts](../e2e-test-setup/reference/playwright.md).

Bind-mount the fixture dir read-only at the WireMock root and point WireMock at
it with `--root-dir` so nothing in the base image is shadowed. WireMock runs as
`root` to bind privileged port 80. Wait on `/__admin/health`.

## Seeding data — from the host, after start

Seed with the stock image's CLI after the container is ready; no custom image.

- **SQL (Postgres):** follow the pattern in
  [seedDatabase.ts](../e2e-test-setup/reference/seeding.md). Copy CSVs in,
  `\copy table(cols) from ... (format csv, header true)`. **Seed parent tables
  before FK children.** Run only **after** the owning service's migrations have
  created the schema (its healthcheck triggers them).
- **DynamoDB (LocalStack):** follow the pattern in
  [seedDynamodb.ts](../e2e-test-setup/reference/seeding.md). `awslocal
  dynamodb create-table` then `batch-write-item --request-items file://...`.
- **S3 (LocalStack):** follow the pattern in
  [seedS3.ts](../e2e-test-setup/reference/seeding.md). Create buckets in the
  app's region, `awslocal s3 cp` the objects. Bucket/key names must match exactly
  what the app requests.

## Producing mock data

Prefer real, minimal, synthetic data over guesses. Source it in this order:

- **Pan-domain settings:** reuse the reference's mocked pan-domain fixture as-is
  ([fixtures/pan-domain-settings/](../e2e-test-setup/reference/auth.md));
  the per-run signing keys are appended at seed time (see `seedS3.ts`), so nothing
  else needs changing.
- **Permission cache:** read the **app's source** to find which permission(s) it
  checks (e.g. `workflow_access`), then seed the cache granting them. Give the
  **default user the most permissive rights** to start with; add restricted users
  only when a scenario needs to assert a denial.
- **Other mocked upstreams:** build reasonable stub responses from two places —
  the **app's source** (the request path/shape it sends and the fields it reads
  back) and the **upstream service's own repository** (its response model /
  example payloads). Keep each response minimal: only the fields the app consumes.
- **If you can't find a realistic payload**, don't invent a risky one — **prompt
  the user** to supply an example response for that service.

## Fixture folder layout
Follow the layout in [scaffold.md](../e2e-test-setup/reference/scaffold.md): `db/` (CSVs),
`dynamodb/`, `permissions/`, plus one folder per mocked service
(`mappings/` + `__files/`), and any auth-settings folders.

## Guardrails
- **No real secrets or personal data** in fixtures — use synthetic emails/ids
  (e.g. `user1@example.com`). This has been a code-review finding before.
- Keep fixtures as test data; they need not track CODE/PROD.

## Verify
- Each mock answers `/__admin/health` and returns stubbed responses for the
  routes the app calls.
- Seeded rows/objects are visible to the app (assert via a test that reads them).

## Guardian specifics

### The mocked upstreams (reference stack)
All run from the shared WireMock image via `MOCK_WIREMOCK_CONFIGS` in
[containers.ts](../e2e-test-setup/reference/stack.md):

| Mock | Hostname alias | Browser-facing https | Templating |
|------|----------------|----------------------|------------|
| CAPI (preview) | `iam-preview.content.local.dev-guardianapis.com` | no | yes |
| Composer | `composer.local.dev-gutools.co.uk` | yes (9082) | yes |
| Presence | `presence.local.dev-gutools.co.uk` | yes (9071) | no (verbatim JS) |
| Telemetry | `user-telemetry.local.dev-gutools.co.uk` | yes (3133) | yes |
| Preferences | `preferences.local.dev-gutools.co.uk` | no | yes |
| TagManager | `tagmanager.local.dev-gutools.co.uk` | no | yes |

Composer/Telemetry admin URLs are returned from `startLocalStack` so tests can
query the WireMock request journal (`/__admin`) to assert calls were made.

### S3 objects (LocalStack), seeded by seedS3.ts
- `permissions-cache` bucket → `CODE/permissions.json` (grants/denies
  `workflow_access`; must include the role emails from `panDomainCookie.ts`).
- `pan-domain-auth-settings` bucket → `local.dev-gutools.co.uk.settings` and
  `.settings.public`, with the per-run RSA keys appended before upload.
- Bucket network aliases sit under `s3.localstack` so virtual-hosted-style
  requests resolve (LocalStack needs `.s3.` in the Host header).

### DynamoDB table, seeded by seedDynamodb.ts
- `editorial-support-CODE` (hash key `id`), populated from
  `fixtures/dynamodb/editorial-support-CODE.json` via `batch-write-item`.

### Postgres CSVs, seeded by seedDatabase.ts
- Order: `section`, `desk`, then `section_desk_mapping`, `section_to_tag`
  (FK children), then `stub`. Column lists live in `DB_SEED_TABLES`.

### Auth-redirect config
`fixtures/auth-redirect/auth-redirect.conf.template` is an nginx template
consumed by `startAuthRedirect` (envsubst at container start) for the optional
host-browser auth cookie endpoint.
