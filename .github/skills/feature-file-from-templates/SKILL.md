---
name: feature-file-from-templates
description: 'Generate a Cucumber/Gherkin .feature file that captures all behavioural scenarios of HTML templates and their related JavaScript/TypeScript, using the workflow-frontend evidence-annotated format. Use when asked to write a feature file, BDD scenarios, or Gherkin from a template/component; to capture UI behaviour as scenarios; or to verify that a feature file covers everything a template and its scripts do.'
argument-hint: '<path to the HTML template (and optionally the related JS/TS)>'
---

# Feature File From Templates

Produce a `.feature` file (Cucumber/Gherkin) that captures every observable behaviour of one or more HTML templates and the JavaScript/TypeScript that drives them, in the repo's evidence-annotated format.

## When to Use
- "Write a feature file / BDD scenarios / Gherkin for this template/component."
- "Capture all the scenarios of this HTML file, including the related JS."
- "Check that this feature file covers everything the template and scripts do."

## Inputs
- One or more HTML template files (the primary source of UI behaviour).
- The related JS/TS: controllers, directives, services, models, event handlers, and any Scala/API endpoints the frontend calls.

## Procedure

1. **Read the template(s) fully.** Note every interactive element and binding:
   - Controllers/directives (`ng-controller`, custom directives), event bindings (`ng-click`, `ng-mousedown`, `ng-keydown`, etc.).
   - Conditional rendering / state classes (`ng-if`, `ng-show`, `ng-class`, `*--hidden` toggles).
   - Repeated content (`ng-repeat`) and what each row renders (icons, labels, ids).
   - Static labels and headings users can see.

2. **Trace the related JS/TS.** For each binding found in the template, follow it into code:
   - What each handler does (emitted events, service calls, state changes).
   - What data populates the view (service methods, models, feature switches).
   - Where emitted events are handled (e.g. modal openers) and what mode/result they produce.
   - Any permission checks or backend endpoints involved.
   - Use `grep_search` for event names and function names to find both emitters and listeners.

3. **Derive scenarios.** Create one scenario per distinct, observable behaviour or branch:
   - Default/initial state, opening/closing, toggling.
   - Each user action and its outcome.
   - Data-driven variations (e.g. feature switch on vs off, permission present vs absent).
   - Rendering details worth asserting (icon + label present, disabled states).
   - Keep steps behaviour-focused (what the user sees/does), not implementation-focused.

4. **Write the feature file** following the [format](#format) below. After every scenario, add `# Evidence:` comment lines listing the workspace-relative paths of the files that justify that scenario.

5. **Verify coverage.** Cross-check the finished file against the template and evidence files. Build a mental table of each template element/behaviour → scenario. Report any element not represented (call out purely decorative gaps explicitly rather than inventing trivial scenarios).

## Format

- Save as `e2e-tests/features/<name>.feature`.
- `Feature:` title on the first line, followed by 1–3 indented plain-English lines describing intent.
- Always use these standard `Background:` steps; only the final "opened" line varies to name the relevant page:
  ```
  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened <the relevant page>
  ```
- One `Scenario:` per behaviour, using `Given` / `When` / `Then` / `And` steps.
- Immediately after each scenario, list the sources as comments:
  ```
  # Evidence: public/path/to/template.html
  # Evidence: public/path/to/controller.js
  ```
- Only cite files you actually inspected; use real workspace-relative paths.

## Example (excerpt)

```gherkin
Feature: Create new content from the dashboard "Create new" dropdown
  This lets an editor start a new piece of content, or import existing content,
  by choosing a content type from the dashboard toolbar

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened the workflow dashboard

  Scenario: Choosing a content type opens the stub modal in create mode
    Given the "Create new" dropdown is open
    When I choose a content type from the list
    Then a stub creation should be requested for that content type
    And the stub modal should open in create mode
  # Evidence: public/layouts/dashboard/dashboard-create.js
  # Evidence: public/components/stub-modal/stub-modal.js
```

## Quality Checklist
- Every interactive element and state branch in the template maps to at least one scenario.
- Data-driven branches (feature switches, permissions) each have on/off scenarios.
- Steps read as user behaviour, not code.
- Each scenario carries accurate `# Evidence:` paths for every file relied upon.
- Uncovered template elements are reported; decorative-only gaps are noted, not padded with filler scenarios.
