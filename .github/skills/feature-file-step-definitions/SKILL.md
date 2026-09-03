---
name: feature-file-step-definitions
description: 'Wire Cucumber/Gherkin .feature files to runnable Playwright tests using playwright-bdd in workflow-frontend. Use when asked to implement step definitions, make feature files executable, connect Gherkin scenarios to Playwright, add missing steps, or run the BDD e2e suite. Complements the feature-file-from-templates skill.'
argument-hint: '<path to the .feature file whose steps need implementing>'
---

# Feature File Step Definitions

Turn `e2e-tests/features/**/*.feature` scenarios into runnable tests using [`playwright-bdd`](https://vitalets.github.io/playwright-bdd/), reusing the repo's existing e2e infrastructure.

## When to Use
- "Implement the step definitions for this feature file."
- "Make `dashboard-create.feature` runnable / connect it to Playwright."
- "Add the missing steps so the BDD suite passes."

## How the suite runs
The [test-e2e runner](../../../e2e-tests/scripts/test-e2e) does two things:
1. `npm exec bddgen` — playwright-bdd reads the `.feature` files and generated step definitions and emits Playwright test files.
2. `npm exec playwright test` — runs the generated tests.

So every Gherkin step needs a matching step definition, and a Playwright config must declare the feature and step locations via `defineBddConfig`.

## Procedure

1. **Reuse the existing BDD config.** [playwright.config.ts](../../../playwright.config.ts) already calls `defineBddConfig({ features: 'e2e-tests/features/**/*.feature', steps: 'e2e-tests/steps/**/*.ts' })` and wires [e2e-tests/globalSetup.ts](../../../e2e-tests/globalSetup.ts), which starts (or reuses) the local stack. Add new step files under `e2e-tests/steps/` — do not create a second config.

2. **Read the feature file** and list every unique `Given`/`When`/`Then`/`And` step. Steps shared across scenarios must resolve to one shared definition — keep wording identical in the feature file so a single step matches.

3. **Reuse the existing fixtures.** [e2e-tests/steps/fixtures.ts](../../../e2e-tests/steps/fixtures.ts) already extends the playwright-bdd `test` with a `stack` fixture (base URL from global setup) and a `signIn(role)` fixture (pan-domain cookie via [panDomainCookie.ts](../../../e2e-tests/setup/panDomainCookie.ts)), and exports `Given`/`When`/`Then`/`expect`. Import these in new step files instead of re-implementing setup. The shared Background steps live in [e2e-tests/steps/background.steps.ts](../../../e2e-tests/steps/background.steps.ts).

4. **Implement steps with the shared `Given`/`When`/`Then`.** Group by feature area under `e2e-tests/steps/`:
   ```ts
   import { When, Then, expect } from './fixtures';

   When('I click the {string} button', async ({ page }, label: string) => {
     await page.getByRole('button', { name: label }).click();
   });

   Then('the content type list should be hidden', async ({ page }) => {
     await expect(page.getByTestId('content-type-list')).toBeHidden();
   });
   ```
   Follow the [Playwright best practices](https://playwright.dev/docs/best-practices) when writing the step bodies (see the section below).
   - Parameterise repeated steps with Cucumber expressions (`{string}`) instead of writing near-duplicate definitions.

5. **Match the Background steps once.** The three standard Background steps (stack running / pan-domain auth / opened page) recur in every feature — implement them a single time in a shared steps file so all features reuse them.

6. **Generate and run.**
   ```bash
   ./e2e-tests/scripts/test-e2e                      # full run
   ./e2e-tests/scripts/test-e2e e2e-tests/features/foo.feature   # single feature
   ```
   `bddgen` fails loudly on any step with no matching definition — use that to find gaps.

## Playwright best practices for step bodies
Apply these when translating a Gherkin step into Playwright code:

- **Prefer user-facing locators.** Reach for `getByRole`, `getByLabel`, `getByText`, and `getByPlaceholder` first — they are resilient to DOM changes and assert accessibility. Only fall back to a stable test hook (`getByTestId`, or an evidence-backed `#id`/state class) when no user-facing attribute uniquely identifies the element. Avoid brittle CSS/XPath chains like `page.locator('button.buttonIcon.episode-actions-later')`.
- **Chain and filter instead of complex selectors.** Narrow with `page.getByRole('listitem').filter({ hasText: 'Product 2' }).getByRole('button', { name: 'Add to cart' })` rather than one long selector string.
- **Use web-first assertions and always `await` them.** Write `await expect(locator).toBeVisible()`, never `expect(await locator.isVisible()).toBe(true)`. Web-first assertions auto-wait and retry, so avoid manual waits/`isVisible()` checks. Never leave a floating promise — every Playwright call in a step must be awaited.
- **Keep steps isolated.** A step must not depend on state leaked from another scenario; rely on the shared fixtures/Background for setup rather than ordering between scenarios. Test isolation keeps failures reproducible.
- **Don't test third-party dependencies.** For calls to external services (e.g. CAPI, preferences), serve controlled data via the repo's WireMock/`e2e-tests/fixtures/responses/` mappings or `page.route(...)`, instead of hitting live systems.
- **Use soft assertions for grouped, non-blocking checks.** When a `Then` verifies several independent facts, `await expect.soft(...)` collects all failures in one run instead of stopping at the first.
- **Map assertions to real DOM hooks.** Trace every selector to the scenario's `# Evidence:` files (ids like `#testing-create-new`, `#testing-dashboard-create-dropdown-*`, state classes like `content-type-list--hidden`, or accessible labels that actually exist).

When a test fails, prefer the Playwright [trace viewer](https://playwright.dev/docs/trace-viewer) (`--trace on`, then `npm exec playwright show-report`) over screenshots to inspect the timeline, DOM snapshots, and network requests.

## Quality Checklist
- Every step in the feature file resolves to exactly one definition; no "undefined step" errors from `bddgen`.
- Setup steps reuse `e2e-tests/setup/` helpers via fixtures, not ad-hoc duplication.
- Locators prefer user-facing attributes (`getByRole`/`getByLabel`/`getByText`); test ids or evidence-backed ids/classes are used only where no user-facing hook fits.
- Assertions are web-first (`await expect(locator).…`) with no manual `isVisible()` checks and no un-awaited Playwright calls.
- External services are stubbed via fixtures/`page.route`, not called live.
- Selectors/assertions trace back to the scenario's `# Evidence:` files (ids, classes, labels that actually exist).
- Repeated steps are parameterised, not copy-pasted.
- `./e2e-tests/scripts/test-e2e <feature>` runs green for the target feature.
