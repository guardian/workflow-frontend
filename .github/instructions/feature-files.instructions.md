---
applyTo: "e2e/features/**/*.feature"
description: "Conventions for authoring Cucumber/Gherkin .feature files in workflow-frontend."
---

# Feature File Conventions

These rules apply to every `.feature` file under `e2e/features/`.

## Structure
- Start with a `Feature:` title, followed by 1–3 indented plain-English lines describing intent.
- Use the standard `Background:` for every feature; only the final "opened" line changes to name the relevant page:
  ```gherkin
  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened <the relevant page>
  ```
- One `Scenario:` per distinct, observable behaviour or branch (default state, open/close, each action, each data/permission variation).

## Steps
- Write steps as user behaviour (what the user sees or does), not implementation detail.
- Use `Given` for preconditions, `When` for actions, `Then` for expected outcomes, `And` to continue the previous keyword.
- Keep wording consistent across scenarios so step definitions can be reused.

## Evidence comments
- Immediately after each scenario, cite every source file the scenario relies on:
  ```gherkin
  # Evidence: public/path/to/template.html
  # Evidence: public/path/to/controller.js
  ```
- Use real, workspace-relative paths, and only cite files that were actually inspected.

## Coverage
- Every interactive element and state branch in the source template must map to at least one scenario.
- Data-driven branches (feature switches, permissions) need both on/off (present/absent) scenarios.
- Do not pad the file with scenarios for purely decorative elements; note such gaps instead.

See the `feature-file-from-templates` skill for the full authoring workflow, and `feature-file-step-definitions` for wiring scenarios to Playwright tests.
