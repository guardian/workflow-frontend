---
name: e2e-test-setup
description: 'Set up an end-to-end (e2e) test suite following the same patterns used to build a proven reference e2e setup: a self-contained Testcontainers stack (the app under test plus its dependencies, each mocked or run for real) driving Playwright/Cucumber-BDD tests, plus a CI workflow. Use when asked to set up e2e tests, add Playwright + Testcontainers, stand up a local stack with mocked services, or apply these e2e patterns to a project. Delegates to the e2e-stack-setup, e2e-fixtures-and-mocks and e2e-ci-workflow skills.'
argument-hint: '<target project and its runtime dependencies, if known>'
---

# E2E test setup (umbrella)

Set up an e2e test suite by following the same patterns used to build the
reference e2e setup: Playwright + `playwright-bdd` running against a
self-contained Testcontainers stack (the app under test plus its dependencies,
each mocked or run for real), plus a GitHub Actions workflow to run it in CI. The
goal is to apply the *approach*, adapted to the project at hand — not to copy the
reference stack.

**Read [reference/e2e-playbook.md](reference/e2e-playbook.md) first.** It is the
source of truth for the patterns, decisions, ports and gotchas, and links to the
reference implementation under [e2e-tests/](https://github.com/guardian/workflow-frontend/tree/main/e2e-tests) as a worked
example. This skill only orchestrates; the detail lives in the playbook and the
phase skills.

## When to use
- "Set up end-to-end tests / Playwright + Testcontainers for this project."
- "Stand up a local stack with mocked upstream services for testing."
- "Use the same e2e patterns/approach as the reference setup here."

## Procedure

Work through the phases in order. Do not skip discovery — the stack shape is
driven entirely by the app's real dependencies.

1. **Phase 0 — Discover** (do this before writing anything):
   - Identify the app's runtime: framework, language, how it's built/run in dev.
   - Enumerate every dependency the app talks to: other services, databases
     (SQL / DynamoDB / etc.), object storage (S3), and each upstream HTTP API.
   - Identify the auth model (how a request is authenticated).
   - For each dependency version-controlled in a Guardian repository (private or
     public), **confirm with the user** whether to run the real service (checked
     out and built from source) or mock it with WireMock. Default to mocking
     unless real behaviour is needed.
   - Confirm Docker is available in the dev/CI environment.

2. **Phase 1–2 — Scaffold + stack** → use the **`e2e-stack-setup`** skill. Bake
   the build-speed optimisations (playbook §6) in here rather than as a separate
   pass.
3. **Phase 3 — Fixtures + mocks** → use the **`e2e-fixtures-and-mocks`** skill.
4. **Phase 4 — Tests** → use the **`feature-file-from-templates`** and
   **`feature-file-step-definitions`** skills. The goal here is only to **validate
   the setup**, not to cover the whole app — **ask the user which part of the UI**
   to extract a small set of features for, and author just those.
5. **Phase 5 — CI** → use the **`e2e-ci-workflow`** skill.

## Guardrails
- Keep the production-app change footprint minimal (ideally one env-gated switch;
  see playbook §4.7). Everything else lives under `e2e-tests/`.
- Never commit real secrets or personal data into fixtures.
- Preserve the key decisions in playbook §4 unless the target genuinely differs;
  when it does, follow playbook §8 (adapting to a different stack).

## Guardian-specific detail
Each phase skill ends with a **Guardian specifics** section covering pan-domain
auth, dev-nginx, the private `guardian/workflow` datastore and the GitHub App
token. Read it as part of that phase.
