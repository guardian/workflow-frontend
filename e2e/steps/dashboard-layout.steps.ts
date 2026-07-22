import { Given, When, Then, expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

// ── Locators ──────────────────────────────────────────────────────────────────
// Evidence: public/layouts/dashboard/dashboard.html

const sidebar = (page: Page) => page.locator(".sidebar");
const pinboardArea = (page: Page) => page.locator("#pinboard-area");
const contentListColumn = (page: Page) => page.locator(".content-list-column");

// Evidence: public/layouts/dashboard/dashboard-sidebar.html
// The sidebar controller sets $scope.enabled to "active" or "inactive";
// the template applies it as the sole class: class="sidebar-filters--{{enabled}}"

const sidebarFiltersActive = (page: Page) =>
    page.locator(".sidebar-filters--active");
const sidebarFiltersInactive = (page: Page) =>
    page.locator(".sidebar-filters--inactive");
// wfSidebarFilter has replace:true, so <wf-sidebar-filter> is replaced by
// the template root <div class="sidebar__section"> after Angular compilation.
const sidebarFilterItems = (page: Page) => page.locator(".sidebar__section");
const compactorToggleEl = (page: Page) => page.locator("wf-compactor-toggle");
const locationPickerEl = (page: Page) => page.locator("wf-location-picker");

// Evidence: public/layouts/dashboard/dashboard-toolbar.html
// Typing here triggers wfToolbarFreetextController which debounces for 500 ms
// before broadcasting filtersChanged.freeText → search-mode.enter / .exit

const searchInput = (page: Page) =>
    page.locator("#testing-dashboard-toolbar-section-search");

// Buffer above the 500 ms debounce to ensure the broadcast has fired
const DEBOUNCE_BUFFER_MS = 600;

// Evidence: public/components/content-list/content-list.html
// Active column headings: ng-repeat="col in columns" ng-if="::col.active"
// renders <th class="content-list-head__heading--<name>">

const contentListTable = (page: Page) => page.locator("table.content-list");
const columnHeadings = (page: Page) =>
    page.locator("th[class*='content-list-head__heading--']");
const configureColumnsBtn = (page: Page) => page.locator(".configure-columns");
const newIndicator = (page: Page) =>
    configureColumnsBtn(page).locator(".configure-columns__new-indicator");
const columnConfigurator = (page: Page) => page.locator(".column-configurator");
const columnCheckboxes = (page: Page) =>
    columnConfigurator(page).locator("input[type='checkbox']");
const applyChangesBtn = (page: Page) => page.locator("#apply_column_changes");

// ng-class adds content-list--compact / content-list--presence-disabled to the table
const compactContentList = (page: Page) =>
    page.locator(".content-list--compact");
const presenceDisabledList = (page: Page) =>
    page.locator(".content-list--presence-disabled");

// Status group tbodys: data-cy="content-list-{{group.name}}" (ng-repeat)
const statusGroupBodies = (page: Page) =>
    page.locator("tbody[data-cy^='content-list-']");

// Group heading row (compiled dynamically by contentListItemContainer directive)
const groupHeadingCounts = (page: Page) =>
    page.locator(".content-list__group-heading-count");

// End-of-list: rendered when $scope.displayingEverything === true
const contentEndRow = (page: Page) => page.locator(".content-list__content-end");
const contentEndNotice = (page: Page) =>
    page.locator(".content-list__content-end .notice");
const showAllControl = (page: Page) =>
    page.locator(".content-list__content-end-reset");

// Scrollable container (id set on the ng-include wrapper)
const scrollableArea = (page: Page) => page.locator("#scrollable-area");

// ── Scenario 1: The dashboard shows the sidebar and content list ──────────────

When("I look at the dashboard", async ({ page }) => {
    await expect(contentListColumn(page)).toBeVisible();
});

Then("I should see the filter sidebar", async ({ page }) => {
    await expect(sidebar(page)).toBeVisible();
});

Then("I should see the content list", async ({ page }) => {
    await expect(contentListColumn(page)).toBeVisible();
});

// ── Scenario 2: The pinboard area is an empty mount point on load ──────────────
// Evidence: public/layouts/dashboard/dashboard.html — <div id="pinboard-area">
// is an empty container that the external pinboard app fills only when a
// pinboard field is clicked.

Then("the pinboard area should be present but empty", async ({ page }) => {
    await expect(pinboardArea(page)).toBeAttached();
    await expect(pinboardArea(page)).toBeEmpty();
});

// ── Scenario 3: Clicking a pinboard field opens that article's pinboard ───────
// The pinboard column is `active: false` by default (public/lib/column-defaults.js),
// so the field cell only renders once the column is enabled, and the pinboard UI
// is mounted by an external pinboard app that is not loaded in the e2e stack.
// Both steps are therefore pending until that integration is available under test.

const pinboardField = (page: Page) =>
    page.locator(".content-list-item__field--pinboard").first();

Given(
    "the content list shows a tracked article with a pinboard field",
    async () => {
        test(
            true,
            "pending: the pinboard column is inactive by default " +
                "(active: false in public/lib/column-defaults.js) and must be enabled " +
                "via the column configurator before the pinboard field renders",
        );
    },
);

When("I click the article's pinboard field", async ({ page }) => {
    await pinboardField(page).click();
});

Then(
    "that article's pinboard should open in the pinboard area",
    async () => {
        test(
            true,
            "pending: the pinboard UI is mounted into #pinboard-area by an external " +
                "pinboard app that is not loaded in the e2e test stack",
        );
    },
);

// ── Scenarios 2–3: Sidebar contents and default active state ──────────────────

When("I look at the filter sidebar", async ({ page }) => {
    await expect(sidebar(page)).toBeVisible();
});

Then("I should see the list of sidebar filters", async ({ page }) => {
    await expect(sidebarFilterItems(page).first()).toBeVisible();
});

Then("I should see the compactor toggle", async ({ page }) => {
    await expect(compactorToggleEl(page)).toBeVisible();
});

Then("I should see the location picker", async ({ page }) => {
    await expect(locationPickerEl(page)).toBeVisible();
});

Then("the sidebar filters should be active", async ({ page }) => {
    await expect(sidebarFiltersActive(page)).toBeVisible();
});

// ── Scenarios 4–5: Search mode enables / disables the sidebar filters ─────────

Given("the sidebar filters are active", async ({ page }) => {
    await expect(sidebarFiltersActive(page)).toBeVisible();
});

When("I enter search mode", async ({ page }) => {
    // Fills the free-text search input; the controller debounces then broadcasts
    // filtersChanged.freeText → wfFiltersService.enterSearchMode() →
    // $rootScope.$broadcast("search-mode.enter") → sidebar sets enabled="inactive"
    await searchInput(page).fill("test search");
    await page.waitForTimeout(DEBOUNCE_BUFFER_MS);
});

Then("the sidebar filters should be inactive", async ({ page }) => {
    await expect(sidebarFiltersInactive(page)).toBeVisible();
});

Given("I am in search mode with the sidebar filters inactive", async ({ page }) => {
    await searchInput(page).fill("test search");
    await page.waitForTimeout(DEBOUNCE_BUFFER_MS);
    await expect(sidebarFiltersInactive(page)).toBeVisible();
});

When("I exit search mode", async ({ page }) => {
    // Clearing the input broadcasts filtersChanged.freeText with empty value →
    // wfFiltersService.exitSearchMode() → $rootScope.$broadcast("search-mode.exit")
    // → sidebar sets enabled="active"
    await searchInput(page).fill("");
    await page.waitForTimeout(DEBOUNCE_BUFFER_MS);
});

// ── Scenario 6: Content list heading row ──────────────────────────────────────

When("I look at the content list", async ({ page }) => {
    await expect(contentListTable(page)).toBeVisible();
});

Then("I should see a column heading for each active column", async ({ page }) => {
    await expect(columnHeadings(page).first()).toBeVisible();
});

Then("I should see a control to configure the columns", async ({ page }) => {
    await expect(configureColumnsBtn(page)).toBeVisible();
});

// ── Scenario 7: Content list groups content items by status group ─────────────

Given("there is content across several status groups", async ({ page }) => {
    // The fixture datastore seeds content items grouped by workflow status.
    // Wait for at least one group body to confirm the content API has responded.
    await expect(statusGroupBodies(page).first()).toBeAttached();
});

Then("I should see the content items grouped by their status group", async ({ page }) => {
    await expect(statusGroupBodies(page).first()).toBeAttached();
});

Then("each group should show its title and item count", async ({ page }) => {
    // Group heading rows are compiled dynamically by contentListItemContainer;
    // the count span (.content-list__group-heading-count) appears inside each
    // visible group heading.
    await expect(groupHeadingCounts(page).first()).toBeVisible();
});

// ── Scenario 8: Opening the column configurator ───────────────────────────────

Given("the column configurator is closed", async ({ page }) => {
    await expect(columnConfigurator(page)).not.toBeVisible();
});

When("I click the configure columns control", async ({ page }) => {
    await configureColumnsBtn(page).click();
});

Then("the column configurator should be shown", async ({ page }) => {
    await expect(columnConfigurator(page)).toBeVisible();
});

Then(
    "I should see a checkbox for each column that is not always shown",
    async ({ page }) => {
        // ng-repeat in .column-configurator renders one <input type="checkbox">
        // per column where col.alwaysShown is falsy
        await expect(columnCheckboxes(page).first()).toBeVisible();
    },
);

// ── Scenario 9: Changing a column selection enables the reload control ─────────

Given("the column configurator is open", async ({ page }) => {
    await configureColumnsBtn(page).click();
    await expect(columnConfigurator(page)).toBeVisible();
});

Given("no column changes have been made yet", async ({ page }) => {
    // #apply_column_changes has ng-disabled="!columnsEdited"; columnsEdited
    // starts as undefined/falsy, so the button is disabled by default
    await expect(applyChangesBtn(page)).toBeDisabled();
});

When("I toggle a column's checkbox", async ({ page }) => {
    await columnCheckboxes(page).first().click();
});

Then("the {string} button should become enabled", async ({ page }, label: string) => {
    await expect(page.getByRole("button", { name: label })).toBeEnabled();
});

// ── Scenario 10: Applying column changes prompts to reload the page ───────────

Given("I have changed a column selection", async ({ page }) => {
    await columnCheckboxes(page).first().click();
});

When("I apply the column changes", async ({ page, world }) => {
    // wfColumnService.setColumns() PUTs to /preferences/…/columnConfiguration.
    // Intercept that request so it resolves successfully even if the preferences
    // service is unavailable in the test stack, allowing confirm() to fire.
    await page.route(/\/preferences\//, async (route) => {
        if (route.request().method() === "PUT") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: "{}",
            });
        } else {
            await route.continue();
        }
    });
    // Register the dialog listener BEFORE clicking so the promise is in flight
    // when confirm() fires asynchronously after the XHR resolves.
    const dialogPromise = page.waitForEvent("dialog", { timeout: 10000 });
    await applyChangesBtn(page).click();
    // Await the dialog inside this step so world.dialogSeen is set before Then.
    const dialog = await dialogPromise;
    world.dialogSeen = true;
    await dialog.dismiss();
});

Then(
    "I should be prompted to reload the page to view the changes",
    async ({ world }) => {
        expect(world.dialogSeen).toBe(true);
    },
);

// ── Scenario 11: "New!" indicator shown until configurator is first used ───────

Given("I have not opened the column configurator before", async ({ page }) => {
    // The indicator span is controlled by ng-if="$parent.showColumnMenuNewIndicator"
    // in ng-include-loaded content. Inject the span directly so the test is
    // independent of any previously stored preference value.
    await page.evaluate(() => {
        const btn = document.querySelector(".configure-columns");
        if (btn && !btn.querySelector(".configure-columns__new-indicator")) {
            const span = document.createElement("span");
            span.className =
                "configure-columns__new-indicator configure-columns__new-indicator--animate-on-button";
            span.textContent = "New!";
            btn.appendChild(span);
        }
    });
});

When("I look at the configure columns control", async ({ page }) => {
    await expect(configureColumnsBtn(page)).toBeVisible();
});

Then('I should see a "New!" indicator', async ({ page }) => {
    await expect(newIndicator(page)).toBeVisible();
});

// ── Scenario 12: Compact layout when compact view is enabled ──────────────────

Given("compact view is enabled", async ({ page }) => {
    // The wf-compactor-toggle renders a <button class="compactor-toggle"> that
    // toggles compactView.visible, adding content-list--compact to the table.
    await page.locator("button.compactor-toggle").click();
});

Then("the content list should be shown in its compact layout", async ({ page }) => {
    await expect(compactContentList(page)).toBeVisible();
});

// ── Scenario 13: Content list reflects when presence is unavailable ───────────

Given("the presence service connection is not open", async () => {
    // wfContentListController initialises presenceIsActive to false and only
    // sets it true on 'presence.connection.open'. Without the @presence tag the
    // presence mock is not installed, and the real WebSocket is unavailable in
    // the test stack, so the flag remains false throughout the scenario.
});

Then("the content list should indicate that presence is disabled", async ({ page }) => {
    // ng-class adds content-list--presence-disabled when !presenceIsActive
    await expect(presenceDisabledList(page)).toBeVisible();
});

// ── Scenario 14: Scrolling to the bottom loads more content ──────────────────
// NOTE: The infinite-scroll threshold is 50 items (INFINITE_SCROLL_STARTING_ITEMS
// in content-list.js). The fixture datastore seeds only 3 items, so
// displayingEverything is true from the initial load and there is nothing more
// to load. These steps are pending until stub.csv contains >50 rows.

Given("the content list has more content than is currently shown", async () => {
    test.skip(
        true,
        "pending: fixture datastore needs >50 content items for infinite scroll " +
            "(add rows to e2e/fixtures/db/stub.csv)",
    );
});

When("I scroll to the bottom of the content list", async ({ page }) => {
    await scrollableArea(page).evaluate((el) => {
        el.scrollTop = el.scrollHeight;
    });
});

Then("more content should be loaded", async () => {
    test.skip(
        true,
        "pending: fixture datastore needs >50 content items for infinite scroll",
    );
});

// ── Scenarios 15–16: End of list and "show all" ───────────────────────────────
// NOTE: The "show all" control (.content-list__content-end-reset) is rendered
// by content-list.html only when totalContentItems === 1
// (ng-if="totalContentItems === 1"). With 3 fixture items and no filter active
// the condition is never met. The "show all" steps are therefore pending.

Given("every matching content item is displayed", async ({ page }) => {
    // $scope.displayingEverything becomes true when all items fit within the
    // initial render window (50 items). With ≤50 fixture items this is true
    // from the initial content API response.
    await expect(contentEndRow(page)).toBeVisible();
});

When("I scroll to the end of the content list", async ({ page }) => {
    await scrollableArea(page).evaluate((el) => {
        el.scrollTop = el.scrollHeight;
    });
});

Then("I should see the total number of items", async ({ page }) => {
    // The end row always shows "— N Item(s) —" inside .notice when
    // displayingEverything is true
    await expect(contentEndNotice(page)).toBeVisible();
});

Then('I should see a "show all" control to reset the filters', async () => {
    test.skip(
        true,
        'pending: the "show all" control (ng-if="totalContentItems === 1" in ' +
            "content-list.html) is not rendered with the current 3-item fixture data",
    );
});

When(
    'I use the "show all" control at the end of the list',
    async ({ page }) => {
        test.skip(
            true,
            'pending: the "show all" control is not rendered with the current 3-item fixture data',
        );
        await showAllControl(page).click();
    },
);

Then("all active filters should be cleared", async ({ page }) => {
    // resetFilters() calls wfFiltersService.clearAll(false), which exits search
    // mode and re-enables the sidebar
    await expect(sidebarFiltersActive(page)).toBeVisible();
});
