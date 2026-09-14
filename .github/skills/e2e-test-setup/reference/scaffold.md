# Reference: scaffold (folder layout & package scripts)

Captured essence of the `e2e-tests/` structure and `package.json`.

## Folder layout

```
e2e-tests/
├── features/          # Gherkin .feature files (one per behaviour area)
├── steps/             # step definitions + Playwright fixtures wiring features to code
│   ├── fixtures.ts    # shared fixtures (stack connection, signIn, mocks, per-scenario world)
│   └── shared/        # network-level mocks
├── setup/             # stack lifecycle + auth helpers (not test steps)
│   ├── stackContainers.ts  # startLocalStack / stopLocalStack (see stack.md)
│   ├── stack/              # per-container recipes + seeding (containers.ts, seed*.ts)
│   ├── sharedStack.ts      # reuse a long-running stack across runs
│   ├── panDomain*.ts       # sign cookies / generate keys (see auth.md)
│   └── run-dev-local.ts    # boots a shared long-running stack for dev:local
├── images/            # Dockerfiles + entrypoint scripts (see dockerfiles.md)
├── fixtures/<domain>/ # test data & config, one folder per domain/service
│   ├── db/ dynamodb/ permissions/ pan-domain-settings/ auth-redirect/
│   └── <service>/     # WireMock mappings/ + __files/ per mocked upstream
├── global-setup.ts    # start/reuse stack, write connection file (see playwright.md)
├── playwright.config.ts
├── mise.toml / .tool-versions   # pinned toolchain (Node ≥ 22.9.0)
└── package.json
```

`e2e-tests/` holds everything unique to the e2e tests; the app's own code stays
at the repo root.

## package.json (essence)

Dev deps: `@playwright/test`, `playwright`, `playwright-bdd`, `testcontainers`,
`tsx`, plus any AWS SDK clients used for seeding, and the pan-domain signing lib.

Scripts — the **standard set** (see playbook §9):

```jsonc
{
  "scripts": {
    // run against an already-running local stack; aborts if none
    "test": "bddgen && playwright test",
    // spin up all infra incl. the app as a container, then run (CI)
    "test:ci": "bddgen && <checkout-real-deps?> && playwright test",
    // Playwright UI (headed), watch, spins up infra if needed
    "test:ui": "bddgen && playwright test --ui-port=<port>",
    // app run natively + deps, pointed at LOCAL infra, watch
    "dev:local": "tsx setup/run-dev-local.ts",
    // app run natively, pointed at REMOTE infra, watch
    "dev": "<run app against remote infra>",
    "test:report": "playwright show-report target/playwright-report --port <port>"
  }
}
```

`bddgen` regenerates tests from `.feature` files; a `bddgen --watch` alongside
`test:ui` picks up `.feature` edits (`.ts` step edits are picked up automatically).
