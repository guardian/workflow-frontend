# Reference: e2e documentation (README)

Captured essence of the `e2e-tests/README.md` that ships with the suite. The
goal is a single doc a newcomer can read to understand, run and extend the e2e
tests. Write it **before the CI phase**, once the stack, fixtures and tests
exist, so it describes what was actually built; note the CI entry points
(`test:ci`) when that phase lands. Adapt every section to the target project —
don't clone the reference wording.

## Required sections (in order)

1. **Overview** — one paragraph: what the suite is (Cucumber/Gherkin `.feature`
   files run with Playwright via `playwright-bdd`), that it stands up a
   self-contained Docker stack (app under test + dependencies, mocked or run for
   real), and that the whole thing runs on one machine so it fits CI.
2. **Local stack** — how the stack is built (Testcontainers over Docker), what
   is mocked (WireMock) vs run for real, and the datastores used (LocalStack
   S3/DynamoDB, Postgres). Include the **dual network-routing** explanation (host
   browser → nginx TLS → forwarded ports; Playwright Chromium → services direct
   via `--host-resolver-rules`) and a **Mermaid diagram** of both paths.
3. **Prerequisites** — Docker running; any private-repo/SSH access needed for a
   dependency run for real; what the devcontainer pre-installs (toolchain, deps,
   browser).
4. **Running the tests** — the standard command set (`test`, `test:ci`,
   `test:ui`, `dev:local`, `dev`, `test:report`; see playbook §9) with a one-line
   description of each, how the app is run, headed/UI access from the host, the
   fast shared-stack loop, and where the report/artifacts land.
5. **Folder structure** — annotated tree of `e2e-tests/` (mirror scaffold.md).
6. **How a test run fits together** — the `global-setup` → `fixtures` → `bddgen`
   → Playwright chain, in a few numbered steps.
7. **Writing tests** — pointers to the feature-file conventions, step
   definitions, the `signIn` auth fixture, and how to add a mock.

## Rules
- Describe what was actually built for this project; prune sections for anything
  the stack doesn't have (e.g. no Postgres if no real service needs it).
- Keep ports and hostnames consistent with the port map (playbook §5) and the
  stack recipes.
- Use synthetic values in any examples — never real secrets or personal data.

## Keep it in sync
The README is a **living document**: whenever a later change alters the e2e
setup — stack containers/ports, fixtures or mocks, the test commands, the folder
layout, or CI — update the matching section in the same change so the doc never
drifts from what the suite actually does.
