# Reference: CI workflow

Captured essence of the GitHub Actions workflow that runs the e2e suite.

Triggers on push to the default branch, `pull_request` and `workflow_dispatch`;
`permissions: contents: read`; `ubuntu-22.04`; `working-directory: e2e-tests`.
Docker is available on GitHub-hosted runners, so Testcontainers builds/starts the
stack directly (no service containers needed).

Steps, in order:

```yaml
jobs:
  playwright-tests:
    runs-on: ubuntu-22.04
    defaults: { run: { working-directory: e2e-tests } }
    steps:
      # 1. (only if a dependency is run for real from a PRIVATE Guardian repo)
      - uses: actions/create-github-app-token@<pinned-sha> # vX
        id: private-repo-token
        with:
          client-id: ${{ vars.PRIVATE_REPO_APP_CLIENT_ID }}
          private-key: ${{ secrets.PRIVATE_REPO_APP_PRIVATE_KEY }}
          repositories: <owner>/<private-repo>
      # 2. app repo
      - uses: actions/checkout@<pinned-sha> # v4
      # 3. each run-for-real dependency repo into the path the stack expects
      #    (public repos need no token)
      - uses: actions/checkout@<pinned-sha> # v4
        with:
          token: ${{ steps.private-repo-token.outputs.token }}
          repository: <owner>/<dependency>
          path: e2e-tests/target/<dependency>
      # 4. toolchain
      - uses: actions/setup-node@<pinned-sha> # v4
        with:
          node-version-file: '.tool-versions'
          cache: yarn
          cache-dependency-path: e2e-tests/yarn.lock
      # 5. deps (app root, then e2e), both --frozen-lockfile
      # 6. Playwright headless shell only (not full Chromium)
      - run: yarn playwright install --with-deps chromium --only-shell
      # 7. run (spins up infra incl. the app container, headless)
      - run: yarn test:ci
      # 8. on failure, upload traces/videos
      - if: failure()
        uses: actions/upload-artifact@<pinned-sha> # v4
        with: { name: playwright-traces, path: e2e-tests/target/test-results, retention-days: 7 }
```

Rules: **pin every action to a commit SHA** with a `# vX` comment; handle arch
differences (dev arm64 vs CI amd64) by pulling arch-appropriate base images (no
single-arch digests); the App token is scoped to the private dependency repo(s)
only and never printed.
