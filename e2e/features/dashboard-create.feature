Feature: Create new content from the dashboard "Create new" dropdown
  This lets an editor start a new piece of content, or import existing content,
  by choosing a content type from the dashboard toolbar

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened the workflow dashboard

  Scenario: The create dropdown is collapsed by default
    Given I have not opened the "Create new" dropdown
    When I look at the dashboard toolbar
    Then the "Create new" button should be visible
    And the content type list should be hidden
  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/layouts/dashboard/dashboard-create.js

  Scenario: Opening the create dropdown reveals the content type options
    Given the "Create new" dropdown is collapsed
    When I click the "Create new" button
    Then the content type list should be shown
    And I should see the available content type options
    And I should see an "Import Content" option
  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/layouts/dashboard/dashboard-create.js

  Scenario: Each content type option shows an icon and a label
    Given the "Create new" dropdown is open
    When I inspect the content type list
    Then each option should show a content type icon
    And each option should show a content type label
  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/lib/content-service.js
  # Evidence: public/lib/model/format-helpers.ts

  Scenario: The content type options are loaded from the available formats
    Given I open the "Create new" dropdown
    When the content type list loads
    Then I should see the standard article format
    And I should see the non-article formats such as "Live blog", "Gallery", "Interactive", "Picture", "Audio" and "Video/Atom"
  # Evidence: public/layouts/dashboard/dashboard-create.js
  # Evidence: public/lib/content-service.js
  # Evidence: public/lib/model/format-helpers.ts

  Scenario: Choosing a content type opens the stub modal in create mode
    Given the "Create new" dropdown is open
    When I choose a content type from the list
    Then a stub creation should be requested for that content type
    And the stub modal should open in create mode
  # Evidence: public/layouts/dashboard/dashboard-create.js
  # Evidence: public/components/stub-modal/stub-modal.js

  Scenario: Creating a new piece adds it to the dashboard content list
    Given the "Create new" dropdown is open
    And I have chosen a content type to open the stub modal in create mode
    When I fill in the new piece's details
    And I submit the stub modal
    Then the new piece should be created
    And the dashboard content list should refresh
    And I should see the new piece on the dashboard
  # Evidence: public/layouts/dashboard/dashboard-create.js
  # Evidence: public/components/stub-modal/stub-modal.js

  Scenario: Choosing Import Content opens the stub modal in import mode
    Given the "Create new" dropdown is open
    When I choose the "Import Content" option
    Then a content import should be requested
    And the stub modal should open in import mode
  # Evidence: public/layouts/dashboard/dashboard-create.js
  # Evidence: public/components/stub-modal/stub-modal.js

  Scenario: Selecting "Article" shows the template selector and requires a commissioned length
    Given the "Create new" dropdown is open
    When I choose "Article" from the content type list
    Then the stub modal should open with the title "Create Article"
    And the commissioned length field should be visible
    And the template selector should be visible
  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/components/stub-modal/stub-modal.html
  # Evidence: public/lib/stub-form-validation.ts

  Scenario: Selecting "Interactive" shows the template selector and requires a commissioned length
    Given the "Create new" dropdown is open
    When I choose "Interactive" from the content type list
    Then the stub modal should open with the title "Create Interactive"
    And the commissioned length field should be visible
    And the template selector should be visible
  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/components/stub-modal/stub-modal.html
  # Evidence: public/lib/stub-form-validation.ts

  Scenario: Selecting a special article format shows the format dropdown and requires a commissioned length
    Given the "Create new" dropdown is open
    When I choose "Key Takeaways" from the content type list
    Then the stub modal should open with the title "Create Key Takeaways"
    And the format dropdown should be visible
    And the commissioned length field should be visible
  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/components/stub-modal/stub-modal.html
  # Evidence: public/lib/model/special-formats.ts
  # Evidence: public/lib/stub-form-validation.ts

  Scenario Outline: Non-article content types do not require a commissioned length
    Given the "Create new" dropdown is open
    When I choose "<content type>" from the content type list
    Then the stub modal should open in create mode
    And the commissioned length field should not be visible

    Examples:
      | content type |
      | Live blog    |
      | Gallery      |
      | Picture      |
      | Audio        |
  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/components/stub-modal/stub-modal.html
  # Evidence: public/lib/stub-form-validation.ts

  Scenario: Selecting "Video/Atom" shows the atom type selector
    Given the "Create new" dropdown is open
    When I choose "Video/Atom" from the content type list
    Then the stub modal should open with the title "Create Atom"
    And the atom type selector should be visible
    And the commissioned length field should not be visible
  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/components/stub-modal/stub-modal.html
  # Evidence: public/components/stub-modal/stub-modal.js

  Scenario Outline: Creating a standard content type sends the correct type to the Composer API
    Given the "Create new" dropdown is open
    And I am ready to intercept Composer API calls
    When I choose "<content type>" from the content type list
    And I fill in the stub form minimum required details
    And I submit the stub modal
    Then the Composer API should have received a request for content type "<composer type>"

    Examples:
      | content type | composer type |
      | Article      | article       |
      | Gallery      | gallery       |
      | Live blog    | liveblog      |
      | Interactive  | interactive   |
      | Picture      | picture       |
      | Audio        | audio         |
  # Evidence: public/lib/composer-service.js
  # Evidence: public/lib/model/special-formats.ts

  Scenario Outline: Creating a special article format sends a displayHint to the Composer API
    Given the "Create new" dropdown is open
    And I am ready to intercept Composer API calls
    When I choose "<content type>" from the content type list
    And I fill in the stub form minimum required details
    And I submit the stub modal
    Then the Composer API should have received a request for content type "article"
    And the Composer API should have received a request with displayHint "<display hint>"

    Examples:
      | content type  | display hint |
      | Key Takeaways | keyTakeaways |
      | Q&A Explainer | qAndA        |
      | Timeline      | timeline     |
      | Mini profiles | miniProfiles |
      | Multi-byline  | multiByline  |
  # Evidence: public/lib/composer-service.js
  # Evidence: public/lib/model/special-formats.ts

  Scenario: Clicking outside the dropdown closes it
    Given the "Create new" dropdown is open
    When I click elsewhere on the page
    Then the content type list should be hidden
  # Evidence: public/layouts/dashboard/dashboard-create.js

  Scenario: Clicking inside the dropdown does not close it
    Given the "Create new" dropdown is open
    When I click inside the dropdown
    Then the content type list should remain shown
  # Evidence: public/layouts/dashboard/dashboard-create.js

  Scenario: Toggling the button again closes the dropdown
    Given the "Create new" dropdown is open
    When I click the "Create new" button again
    Then the content type list should be hidden
  # Evidence: public/layouts/dashboard/dashboard-create.html
  # Evidence: public/layouts/dashboard/dashboard-create.js
