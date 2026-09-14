---
mode: 'agent'
description: 'Kick off setting up an e2e test suite (Testcontainers stack + Playwright/BDD + CI) on this project, following the same patterns used to build a proven reference e2e setup.'
tools: ['codebase', 'search', 'usages', 'editFiles', 'runCommands', 'fetch', 'githubRepo', 'problems']
---

# Set up e2e tests

Set up a self-contained end-to-end test suite on this project by following the
same patterns used to build a reference e2e setup, per the
**`e2e-test-setup` skill** and its
[reference playbook](../skills/e2e-test-setup/reference/e2e-playbook.md). Use the
`e2e-test-setup` agent's phased approach, adapting each pattern to this project's
stack rather than copying the reference stack.

Before scaffolding anything, run **Phase 0 discovery** and confirm findings with
me. Establish:

1. **App runtime** — framework/language and how the app is built and run in dev.
2. **Dependencies** — every service and store the app talks to:
   - other services, and whether each is version-controlled in a Guardian
     repository (private or public);
   - databases (SQL, DynamoDB, …);
   - object storage (S3);
   - each upstream HTTP API.
   For each Guardian-repo dependency, I'll confirm with you whether to run the
   real service (checked out and built from source) or mock it with WireMock.
3. **Auth model** — how a request is authenticated (cookie/JWT/OIDC/pan-domain).
4. **Environment** — is Docker available in the dev container and in CI?
5. **Scope** — which of these phases to do now: scaffold+stack, fixtures+mocks,
   feature tests, CI workflow. (Build-speed optimisations are baked into the
   stack build, not a separate phase.) The feature-tests phase only **validates
   the setup** — tell me which part of the UI to extract a small set of features
   for, rather than covering the whole app.

Infer as much as possible from the codebase first, then ask me only what's left.
Once I confirm the discovery summary, proceed phase by phase, delegating to the
`e2e-stack-setup`, `e2e-fixtures-and-mocks` and `e2e-ci-workflow` skills, and
verifying each phase before the next.

Follow the standard command set and guiding principles in the playbook (§9–§11):
the app runs natively in dev and is containerised only in CI; provide anything
the browser needs server-side (no forced cookies or browser mocks for dev).

Each phase skill ends with a **Guardian specifics** section (pan-domain auth, the
private `guardian/workflow` datastore, the GitHub App token) — read it as part of
that phase.
