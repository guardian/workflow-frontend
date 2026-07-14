---
name: feature-file-step-definitions
description: 'Wire Cucumber/Gherkin .feature files to runnable Playwright tests using playwright-bdd in workflow-frontend. Use when asked to implement step definitions, make feature files executable, connect Gherkin scenarios to Playwright, add missing steps, or run the BDD e2e suite. Complements the feature-file-from-templates skill.'
argument-hint: '<path to the .feature file whose steps need implementing>'
---

# Feature File Step Definitions

Turn `e2e/features/**/*.feature` scenarios into runnable tests using [`playwright-bdd`](https://vitalets.github.io/playwright-bdd/), reusing the repo's existing e2e infrastructure.

## When to Use
- "Implement the step definitions for this feature file."
- "Make `dashboard-create.feature` runnable / connect it to Playwright."
- "Add the missing steps so the BDD suite passes."

## How the suite runs
The [test-e2e runner](../../../e2e/scripts/test-e2e) does two things:
1. `npm exec bddgen` — playwright-bdd reads the `.feature` files and generated step definitions and emits Playwright test files.
2. `npm exec playwright test` — runs the generated tests.

So every Gherkin step needs a matching step definition, and a Playwright config must declare the feature and step locations via `defineBddConfig`.

## Procedure

1. **Reuse the existing BDD config.** [playwright.config.ts](../../../playwright.config.ts) already calls `defineBddConfig({ features: 'e2e/features/**/*.feature', steps: 'e2e/steps/**/*.ts' })` and wires [e2e/globalSetup.ts](../../../e2e/globalSetup.ts), which starts (or reuses) the local stack. Add new step files under `e2e/steps/` — do not create a second config.

2. **Read the feature file** and list every unique `Given`/`When`/`Then`/`And` step. Steps shared across scenarios must resolve to one shared definition — keep wording identical in the feature file so a single step matches.

3. **Reuse the existing fixtures.** [e2e/steps/fixtures.ts](../../../e2e/steps/fixtures.ts) already extends the playwright-bdd `test` with a `stack` fixture (base URL from global setup) and a `signIn(role)` fixture (pan-domain cookie via [panDomainCookie.ts](../../../e2e/setup/panDomainCookie.ts)), and exports `Given`/`When`/`Then`/`expect`. Import these in new step files instead of re-implementing setup. The shared Background steps live in [e2e/steps/background.steps.ts](../../../e2e/steps/background.steps.ts).

4. **Implement steps with the shared `Given`/`When`/`Then`.** Group by feature area under `e2e/steps/`:
   ```ts
   import { When, Then, expect } from './fixtures';

   When('I click the {string} button', async ({ page }, label: string) => {
     await page.getByRole('button', { name: label }).click();
   });

   Then('the content type list should be hidden', async ({ page }) => {
     await expect(page.locator('.content-type-list--hidden')).toBeVisible();
   });
   ```
   - Map assertions to real DOM hooks from the evidence files (ids like `#testing-create-new`, `#testing-dashboard-create-dropdown-*`, state classes like `content-type-list--hidden`).
   - Parameterise repeated steps with Cucumber expressions (`{string}`) instead of writing near-duplicate definitions.

5. **Match the Background steps once.** The three standard Background steps (stack running / pan-domain auth / opened page) recur in every feature — implement them a single time in a shared steps file so all features reuse them.

6. **Generate and run.**
   ```bash
   ./e2e/scripts/test-e2e                      # full run
   ./e2e/scripts/test-e2e e2e/features/foo.feature   # single feature
   ```
   `bddgen` fails loudly on any step with no matching definition — use that to find gaps.

## Quality Checklist
- Every step in the feature file resolves to exactly one definition; no "undefined step" errors from `bddgen`.
- Setup steps reuse `e2e/setup/` helpers via fixtures, not ad-hoc duplication.
- Selectors/assertions trace back to the scenario's `# Evidence:` files (ids, classes, labels that actually exist).
- Repeated steps are parameterised, not copy-pasted.
- `./e2e/scripts/test-e2e <feature>` runs green for the target feature.
