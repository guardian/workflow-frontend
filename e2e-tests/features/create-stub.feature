Feature: Create content from the dashboard "Create new" dropdown
  An editor starts a new piece of content by opening the "Create new" dropdown,
  choosing a content type, and completing the stub modal that opens.

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened the workflow dashboard

  Scenario: The content type list is hidden until the dropdown is opened
    Then the content type list should be hidden
    When I open the "Create new" dropdown
    Then the content type list should be visible

  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/layouts/dashboard/dashboard-create.js

  Scenario: Opening the dropdown reveals an import option
    When I open the "Create new" dropdown
    Then I should see the "Import Content" option

  # Evidence: public/layouts/dashboard/dashboard-create.html

  Scenario: Choosing a content type opens the stub modal in create mode
    Given I have opened the "Create new" dropdown
    When I choose the "Article" content type
    Then the stub modal should open with title "Create Article"
    And the working title field should be empty

  # Evidence: public/layouts/dashboard/dashboard-create.js
  # Evidence: public/components/stub-modal/stub-modal.js
  # Evidence: public/components/stub-modal/stub-modal.html

  Scenario: Cancelling the stub modal closes it without creating content
    Given I have opened the stub modal for an "Article"
    When I cancel the stub modal
    Then the stub modal should be closed

  # Evidence: public/components/stub-modal/stub-modal.html

  Scenario: The section list is populated from the datastore
    Given I have opened the stub modal for an "Article"
    Then the "Technology" section should be available

  # Evidence: public/components/stub-modal/stub-modal.html
  # Evidence: app/controllers/Application.scala

  Scenario: Entering a working title and section enables content creation
    Given I have opened the stub modal for a "Gallery"
    When I enter the working title "My e2e test story"
    And I select the "Technology" section
    Then the create-content button should be enabled

  # Evidence: public/components/stub-modal/stub-modal.html
  # Evidence: public/components/stub-modal/stub-modal.js
  # Evidence: public/lib/content-service.js
