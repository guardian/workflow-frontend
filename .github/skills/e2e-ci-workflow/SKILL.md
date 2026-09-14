---
name: e2e-ci-workflow
description: 'Add a GitHub Actions workflow that runs the Playwright/Testcontainers e2e suite in CI: check out any private Guardian repo (for a dependency you run for real) via a GitHub App token, install the toolchain and the Playwright headless shell only, run the BDD suite, and upload traces on failure. Use when adding e2e tests to CI, creating the GitHub Actions workflow for Playwright, or granting CI access to a private dependency repository.'
argument-hint: '<any private repos for real dependencies, and CI runner constraints>'
---

# E2E CI workflow

Phase 5 of the playbook: run the e2e suite in GitHub Actions. Follow the pattern in
[ci-workflow.md](../e2e-test-setup/reference/ci-workflow.md)
(worked example).
**Read [../e2e-test-setup/reference/e2e-playbook.md](../e2e-test-setup/reference/e2e-playbook.md)
§6–§7 first.**

## Workflow shape
Trigger on `push` to the default branch, `pull_request`, and
`workflow_dispatch`. `permissions: contents: read`. Run on `ubuntu-22.04` with
`defaults.run.working-directory: e2e-tests`.

Steps, in order:

1. **(If you run any dependency for real from a private Guardian repo) mint a
   GitHub App token** — default pattern:
   ```yaml
   - uses: actions/create-github-app-token@<pinned-sha> # vX
     id: private-repo-token
     with:
       client-id: ${{ vars.PRIVATE_REPO_APP_CLIENT_ID }}
       private-key: ${{ secrets.PRIVATE_REPO_APP_PRIVATE_KEY }}
       repositories: <owner>/<private-repo>
   ```
   This is the **recommended default** for checking out a private dependency
   repo: create a GitHub App with read access to that repo, store its client id
   as a repo **variable** and its private key as a repo **secret**. (Alternatives
   — a PAT or a deploy key — are possible but less scoped; prefer the App token.)

2. **Check out the app repo** (`actions/checkout`).

3. **Check out each private dependency repo** into the path the stack expects
   (e.g. `e2e-tests/target/<dependency>`) using
   `token: ${{ steps.private-repo-token.outputs.token }}`. A **public** Guardian
   repo needs no token — check it out with plain `actions/checkout`.

4. **Install the toolchain** — `actions/setup-node` with
   `node-version-file: '.tool-versions'`, `cache: yarn`,
   `cache-dependency-path: e2e-tests/yarn.lock`.

5. **Install deps** — app deps (root) then e2e deps, both
   `--frozen-lockfile`.

6. **Install Playwright headless shell only** —
   `yarn playwright install --with-deps chromium --only-shell` (the shell, not
   full Chromium — faster).

7. **Run** — `yarn test:ci` (spins up all infra and the app container, then runs
   the suite headlessly; equivalent to `bddgen` + starting the stack +
   `playwright test`).

8. **Upload artifacts on failure** — `actions/upload-artifact` with the
   `target/test-results` path, `if: failure()`, short retention.

## Rules
- **Pin every action to a commit SHA** with a `# vX` comment (a review
  requirement and a CodeQL finding).
- Docker must be available on the runner (it is on GitHub-hosted `ubuntu-*`); the
  stack builds/starts containers via Testcontainers, no service containers
  needed.
- Handle arch differences: dev is often arm64, CI amd64 — pull arch-appropriate
  base images, don't pin single-arch digests.
- Report to CI natively: in `playwright.config.ts`, use the `github` reporter
  when `process.env.CI`.

## Verify
- The workflow runs on a PR and the suite passes.
- Failure runs upload traces/videos.
- No secret is printed; the App token is scoped to the private dependency repo(s)
  only.

## Guardian specifics

See the live workflow at
[ci-workflow.md](../e2e-test-setup/reference/ci-workflow.md).

### GitHub App token for guardian/workflow
The datastore (run for real) lives in the private `guardian/workflow` repo. A
dedicated GitHub App was created with **read** access to it. The workflow reads:
- `vars.WORKFLOW_APP_CLIENT_ID` (repo **variable**) — the App client id.
- `secrets.WORKFLOW_APP_PRIVATE_KEY` (repo **secret**) — the App private key.

and mints a token with `actions/create-github-app-token`, scoped to
`repositories: guardian/workflow`, used to check it out into
`e2e-tests/target/workflow-backend` (where `stackContainers.ts` / `getBackendDir`
expect it).

### Node version
Node is read from `.tool-versions`. The app needs Node ≥ `22.9.0` (a dependency
of the e2e tests is incompatible with `22.5.1`).

### Pinned actions (keep SHAs current)
- `actions/create-github-app-token`
- `actions/checkout`
- `actions/setup-node`
- `actions/upload-artifact`

All pinned to a commit SHA with a `# vX` comment (CodeQL / review requirement).

### Runner
`ubuntu-22.04`, `working-directory: e2e-tests`. Docker is available on the
GitHub-hosted runner, so Testcontainers builds and runs the stack directly.
Install the headless shell only: `yarn playwright install --with-deps chromium
--only-shell`.
