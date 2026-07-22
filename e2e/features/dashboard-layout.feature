Feature: The workflow dashboard layout
  The dashboard brings together the filter sidebar, the pinboard area and the
  content list so an editor can browse, filter and configure their view of content

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened the workflow dashboard

  Scenario: The dashboard shows the sidebar and content list
    When I look at the dashboard
    Then I should see the filter sidebar
    And I should see the content list
  # Evidence: public/layouts/dashboard/dashboard.html
  # Evidence: public/layouts/dashboard/dashboard-sidebar.html
  # Evidence: public/components/content-list/content-list.html

  Scenario: The pinboard area is empty until a pinboard is opened
    When I look at the dashboard
    Then the pinboard area should be present but empty
  # Evidence: public/layouts/dashboard/dashboard.html

  Scenario: Clicking the pinboard field of a tracked article opens its pinboard
    Given the content list shows a tracked article with a pinboard field
    When I click the article's pinboard field
    Then that article's pinboard should open in the pinboard area
  # Evidence: public/layouts/dashboard/dashboard.html
  # Evidence: public/components/content-list-item/templates/pinboard.html
  # Evidence: public/lib/column-defaults.js

  Scenario: The sidebar shows the filters, compactor toggle and location picker
    When I look at the filter sidebar
    Then I should see the list of sidebar filters
    And I should see the compactor toggle
    And I should see the location picker
  # Evidence: public/layouts/dashboard/dashboard-sidebar.html
  # Evidence: public/layouts/dashboard/dashboard-sidebar.js

  Scenario: The sidebar is active by default
    When I look at the filter sidebar
    Then the sidebar filters should be active
  # Evidence: public/layouts/dashboard/dashboard-sidebar.html
  # Evidence: public/layouts/dashboard/dashboard-sidebar.js

  Scenario: Entering search mode disables the sidebar filters
    Given the sidebar filters are active
    When I enter search mode
    Then the sidebar filters should be inactive
  # Evidence: public/lib/filters-service.js

  Scenario: Leaving search mode re-enables the sidebar filters
    Given I am in search mode with the sidebar filters inactive
    When I exit search mode
    Then the sidebar filters should be active
  # Evidence: public/layouts/dashboard/dashboard-sidebar.js
  # Evidence: public/lib/filters-service.js

  Scenario: The content list renders a heading row of the active columns
    When I look at the content list
    Then I should see a column heading for each active column
    And I should see a control to configure the columns
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: The content list groups content items by status group
    Given there is content across several status groups
    When I look at the content list
    Then I should see the content items grouped by their status group
    And each group should show its title and item count
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Opening the column configurator reveals the selectable columns
    Given the column configurator is closed
    When I click the configure columns control
    Then the column configurator should be shown
    And I should see a checkbox for each column that is not always shown
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Changing a column selection enables the reload control
    Given the column configurator is open
    And no column changes have been made yet
    When I toggle a column's checkbox
    Then the "Reload to view changes" button should become enabled
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Applying column changes prompts to reload the page
    Given the column configurator is open
    And I have changed a column selection
    When I apply the column changes
    Then I should be prompted to reload the page to view the changes
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: A "New!" indicator is shown until the column configurator is used
    Given I have not opened the column configurator before
    When I look at the configure columns control
    Then I should see a "New!" indicator
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: The content list uses the compact layout when compact view is enabled
    Given compact view is enabled
    When I look at the content list
    Then the content list should be shown in its compact layout
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: The content list reflects when presence is unavailable
    Given the presence service connection is not open
    When I look at the content list
    Then the content list should indicate that presence is disabled
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Scrolling to the bottom loads more content
    Given the content list has more content than is currently shown
    When I scroll to the bottom of the content list
    Then more content should be loaded
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: The end of the list shows the total item count when everything is displayed
    Given every matching content item is displayed
    When I scroll to the end of the content list
    Then I should see the total number of items
    And I should see a "show all" control to reset the filters
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js

  Scenario: Using "show all" clears the active filters
    Given every matching content item is displayed
    When I use the "show all" control at the end of the list
    Then all active filters should be cleared
  # Evidence: public/components/content-list/content-list.html
  # Evidence: public/components/content-list/content-list.js
