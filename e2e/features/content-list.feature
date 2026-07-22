Feature: The dashboard content list
  The content list shows an editor's content grouped by status, with sortable and
  configurable columns, presence indicators, infinite scrolling and a loader while
  content is fetched and rendered

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened the workflow dashboard

  Scenario: The content list shows a loader until content has rendered
    When content is being fetched
    Then a loader should be shown over the content list
    And the loader should disappear once the content has rendered
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/loader/loader.js

  Scenario: The content list renders a heading row of the active columns
    When I look at the content list
    Then I should see a heading for each active column
    And I should see a notifier column at the start and end of the row
    And I should see a control to configure the columns
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Content items are grouped by their status group
    Given there is content across several status groups
    When I look at the content list
    Then I should see the content items grouped by their status group
    And each group should show its title and item count
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  # Enforced by linting / accessibility rules, so not tested here
  # Scenario: A column heading shows a title tooltip when one is configured
  #   When I hover over a column heading that has a title
  #   Then I should see the column's title as a tooltip
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: The presence column shows its available title when presence is connected
    Given the presence service is connected
    When I hover over the presence column heading
    Then I should see the presence column's available title
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: The presence column shows its unavailable title when presence is disconnected
    Given the presence service is not connected
    When I hover over the presence column heading
    Then I should see the presence column's unavailable title
    And the content list should be styled as presence-disabled
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: The content list renders in compact view when the compactor is enabled
    Given the compact view preference is enabled
    When I look at the content list
    Then the content list should be shown in compact view
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Opening the column configurator reveals the selectable columns
    Given the column configurator is closed
    When I click the configure columns control
    Then the column configurator should be shown
    And I should see a checkbox for each column that is not always shown
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Toggling a column enables the reload control
    Given the column configurator is open
    And no column changes have been made
    Then the reload control should be disabled
    When I toggle a column's checkbox
    Then the reload control should be enabled
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Applying column changes prompts to reload the page
    Given the column configurator is open with column changes made
    When I click the reload control
    Then I should be prompted to reload the page to view the changes
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  # Can consider to drop this feature
  # Scenario: A "New!" indicator is shown against the configurator until it is opened
  #   Given the new field has not yet been seen
  #   When I look at the content list
  #   Then a "New!" indicator should be shown against the configure columns control
  #   And a "New!" indicator should be shown against the new column in the configurator
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  # Can consider to drop this feature
  # Scenario: The "New!" indicator is not shown once the configurator has been opened
  #   Given the new field has already been seen
  #   When I look at the content list
  #   Then no "New!" indicator should be shown against the configure columns control
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Sorting content by clicking a sortable column heading
    Given the content list is sorted by the default column
    When I click a different sortable column heading
    Then the content should be sorted by that column in its default direction
  # Evidence: public/components/content-list/content-list.js

  Scenario: Re-clicking the sorted column inverts the sort direction
    Given the content list is sorted ascending by a column
    When I click that column's heading again
    Then the content should be sorted descending by the same column
  # Evidence: public/components/content-list/content-list.js

  Scenario: Scrolling to the bottom loads more content items
    Given there is more content than is currently displayed
    When I scroll to the bottom of the content list
    Then more content items should be loaded and displayed
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: The end-of-list notice shows the total item count when everything is displayed
    Given every content item is displayed
    When I scroll to the bottom of the content list
    Then I should see a notice with the total number of items
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  # Talk to stackholder whether this is a useful feature or not
  Scenario: The end-of-list notice offers to show all when a single item matches
    Given the filters match exactly one content item
    When I look at the end-of-list notice
    Then the notice should show a single item
    And I should see a "show all" control to reset the filters
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Resetting the filters from the end-of-list notice
    Given the end-of-list notice is showing the "show all" control
    When I click the "show all" control
    Then all filters should be cleared
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js
