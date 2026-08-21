@presence
Feature: Presence indicators on a piece of content
  This shows editors who else is currently on a piece of content,
  what they are doing, and how to contact them

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened the workflow dashboard

  Scenario: Nobody is present on a piece of content in the drawer
    Given a piece of content has no active presence
    When I view its presence indicators in the drawer
    Then I should see a "Nobody" placeholder
    And I should not see any presence icons
  # Evidence: public/components/presence-indicator/presence-indicators.html
  # Evidence: public/components/presence-indicator/presence-indicators.js

  Scenario: Nobody is present on a piece of content in the content list
    Given a piece of content has no active presence
    When I view its presence indicators in the content list
    Then I should not see the "Nobody" placeholder
    And I should not see any visible presence icon
  # Evidence: public/components/presence-indicator/presence-indicators.html
  # Evidence: public/components/presence-indicator/presence-indicators.js

  Scenario: Someone editing the body shows as present
    Given a colleague is editing the body of a piece of content
    When I view its presence indicators
    Then I should see a presence icon marked as present
    And the icon should show their initials
    And its title should describe them as editing body
  # Evidence: public/components/presence-indicator/presence-indicators.js
  # Evidence: public/components/presence-indicator/presence-indicators.html

  Scenario: Someone present at the document location also shows as present
    Given a colleague is present on a piece of content at the document location
    When I view its presence indicators
    Then I should see a presence icon marked as present
  # Evidence: public/components/presence-indicator/presence-indicators.js

  Scenario: Someone who has saved and closed shows as editing furniture
    Given a colleague is present on a piece of content editing only its furniture
    When I view its presence indicators
    Then I should see a presence icon marked as furniture
    And its title should describe them as editing furniture
  # Evidence: public/components/presence-indicator/presence-indicators.js

  Scenario: Someone present but not editing shows as idle
    Given a colleague is present on a piece of content but not editing the body or furniture
    When I view its presence indicators
    Then I should see a presence icon marked as idle
    And its title should describe them as idle
  # Evidence: public/components/presence-indicator/presence-indicators.js

  Scenario: A contributor to a live blog is always shown as present
    Given a colleague is idle on a live blog
    When I view its presence indicators
    Then I should see a presence icon marked as present
    And its title should describe them as editing body
  # Evidence: public/components/content-list-item/templates/presence.html
  # Evidence: public/components/presence-indicator/presence-indicators.js

  Scenario: The presence icon shows initials in the content list and the full name in the drawer
    Given a colleague named "Jane Doe" is present on a piece of content
    When I view its presence indicators in the content list
    Then the presence icon should show the initials "JD"
    When I view its presence indicators in the drawer
    Then the presence icon should show the full name "Jane Doe"
  # Evidence: public/components/presence-indicator/presence-indicators.js
  # Evidence: public/components/presence-indicator/presence-indicators.html

  Scenario: The presence icon links to the person's email
    Given a colleague with email "jane.doe@guardian.co.uk" is present on a piece of content
    When I view its presence indicators
    Then the presence icon should link to "mailto:jane.doe@guardian.co.uk"
  # Evidence: public/components/presence-indicator/presence-indicators.html
  # Evidence: public/components/presence-indicator/presence-indicators.js

  Scenario: The hover title shows the full name in the content list and the email in the drawer
    Given a colleague named "Jane Doe" with email "jane.doe@guardian.co.uk" is editing the body of a piece of content
    When I view its presence indicators in the content list
    Then the icon title should be "Jane Doe - editing body"
    When I view its presence indicators in the drawer
    Then the icon title should be "jane.doe@guardian.co.uk - editing body"
  # Evidence: public/components/presence-indicator/presence-indicators.js
  # Evidence: public/components/presence-indicator/presence-indicators.html

  Scenario: Multiple people are ordered by activity
    Given the following colleagues are present on a piece of content:
      | name        | location          |
      | Ann Idle    | idle              |
      | Bob Body    | body              |
      | Cara Chrome | furniture         |
    When I view its presence indicators
    Then the presence icons should be ordered present, then furniture, then idle
  # Evidence: public/components/presence-indicator/presence-indicators.js

  Scenario: Duplicate presence entries for the same person are shown once
    Given a colleague is present on a piece of content from more than one session
    When I view its presence indicators
    Then I should see a single presence icon for that person
  # Evidence: public/components/presence-indicator/presence-indicators.js

  Scenario: Presence updates live as people come and go
    Given I am viewing the presence indicators for a piece of content
    When a presence update arrives for that content
    Then the presence indicators should update to match
  # Evidence: public/components/presence-indicator/presence-indicators.js
  # Evidence: public/components/presence-indicator/presence-status.js
  # Evidence: public/lib/presence.js

  Scenario: A presence update for a different piece of content is ignored
    Given I am viewing the presence indicators for a piece of content
    When a presence update arrives for a different piece of content
    Then the presence indicators should not change
  # Evidence: public/components/presence-indicator/presence-indicators.js
