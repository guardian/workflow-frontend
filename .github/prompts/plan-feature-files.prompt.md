---
mode: 'agent'
description: 'Survey a frontend project''s features and recommend an ordered plan for generating Cucumber/Gherkin feature files and their Playwright/BDD step definitions.'
tools: ['search/codebase', 'search', 'search/usages', 'vscodeGeneral/usages', 'web/fetch', 'read/problems','vscodeTasks/problems']
---

# Plan feature files and test steps

Give me an overview of the features in this application and recommend a plan for
the order in which to generate feature files and their test step definitions.

## What to do

1. **Inventory the features.** Explore the codebase and build a complete list of
   user-facing features. Treat each UI template/component (and the
   controllers/services/handlers that drive it) as a unit, and also note
   server-rendered pages and admin flows. Group related units into feature
   areas.
   - Frontend: HTML templates, components, directives, and their JS/TS.
   - Backend: routes/controllers and server-rendered views that expose distinct
     user journeys.

2. **Note existing coverage.** Check for any feature files that already exist
   (e.g. under `e2e-tests/features/`) and mark those areas as covered so the plan
   doesn't repeat them.

3. **Recommend a generation order** organised into phases. Optimise the ordering
   for:
   - **Shared-step reuse** — do foundational views first so later features reuse
     their "loaded / open / displayed" steps instead of re-deriving them.
   - **UI dependencies** — containers before their child components.
   - **User value** — cover the core end-to-end journey earliest.
   - **Effort/risk** — call out large, high-branch components vs. small leaf
     widgets.
   Put full-page / server-rendered flows that share little step vocabulary with
   the main app last.

4. **Reference the workflow.** For each item, note that the
   **`feature-file-from-templates` skill** writes the `.feature` file and the
   **`feature-file-step-definitions` skill** wires it to runnable
   Playwright/BDD tests, and recommend doing them together per item so the shared
   step library grows incrementally.

## Output

- A grouped overview of feature areas, each linked to the relevant
  template/route files.
- An explicit list of what is already covered.
- A phased, numbered plan with a one-line rationale per phase, ending with a
  short note on the practical workflow (write feature file → wire steps → next).

Infer as much as possible from the codebase; only ask me if something essential
is ambiguous.
