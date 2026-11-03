Feature: DO NOT MERGE - E2E media reporting validation
  This temporary scenario deliberately fails to verify report attachments in CI.
  It must never be merged into an application branch.

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened the reporting validation page

  @reporting-validation @do-not-merge
  Scenario: A deliberate failure captures screenshots and first-retry media
    When I enter "PR 634 media validation" in the validation message
    Then the reporting validation shows the intentionally incorrect status
  # Evidence: e2e-tests/steps/reporting-validation.steps.ts
  # Evidence: e2e-tests/steps/background.steps.ts
  # Evidence: e2e-tests/steps/fixtures.ts
  # Evidence: e2e-tests/playwright.config.ts