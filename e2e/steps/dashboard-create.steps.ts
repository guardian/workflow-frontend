import { Given, When, Then, expect } from "./fixtures";
import type { Page, Locator } from "@playwright/test";

// Locators scoped to the "Create new" dropdown (dashboard-user.html reuses the
// same controller, so we anchor on the --create modifier class).
const createDropdown = (page: Page): Locator =>
    page.locator(".dashboard-toolbar__dropdown--create");
const createButton = (page: Page): Locator => page.locator("#testing-create-new");
const contentTypeList = (page: Page): Locator =>
    createDropdown(page).locator("ul.dropdown-toolbar__list");
const contentTypeOptions = (page: Page): Locator =>
    // Exclude the "Import Content" row: it shares the list-item class but is an
    // import action, not a content type, so it has no content-type icon.
    contentTypeList(page)
        .locator("li.dropdown-toolbar__item")
        .filter({
            hasNot: page.locator("#testing-dashboard-create-dropdown-import"),
        });
const importOption = (page: Page): Locator =>
    page.locator("#testing-dashboard-create-dropdown-import");
const stubModal = (page: Page): Locator => page.locator(".stubModal");

const NON_ARTICLE_FORMATS = [
    "Live blog",
    "Gallery",
    "Interactive",
    "Picture",
    "Audio",
    "Video/Atom",
];

async function openDropdown(page: Page): Promise<void> {
    await createButton(page).click();
    await expect(contentTypeList(page)).not.toHaveClass(/content-type-list--hidden/);
}

// --- Preconditions -------------------------------------------------------

Given('I have not opened the "Create new" dropdown', async () => {
    // Initial page state; nothing to do.
});

Given('the "Create new" dropdown is collapsed', async ({ page }) => {
    await expect(contentTypeList(page)).toHaveClass(/content-type-list--hidden/);
});

Given('the "Create new" dropdown is open', async ({ page }) => {
    await openDropdown(page);
});

Given('I open the "Create new" dropdown', async ({ page }) => {
    await openDropdown(page);
});

// --- Actions -------------------------------------------------------------

When("I look at the dashboard toolbar", async ({ page }) => {
    await expect(createDropdown(page)).toBeVisible();
});

When('I click the "Create new" button', async ({ page }) => {
    await createButton(page).click();
});

When('I click the "Create new" button again', async ({ page }) => {
    await createButton(page).click();
});

When("I inspect the content type list", async ({ page }) => {
    await expect(contentTypeList(page)).toBeVisible();
});

When("the content type list loads", async ({ page }) => {
    await expect(contentTypeOptions(page).first()).toBeVisible();
});

When("I choose a content type from the list", async ({ page }) => {
    await contentTypeOptions(page).first().click();
});

When('I choose the "Import Content" option', async ({ page }) => {
    await importOption(page).click();
});

When("I click elsewhere on the page", async ({ page }) => {
    // The dropdown directive closes on any document-level click.
    await page.evaluate(() => document.body.click());
});

When("I click inside the dropdown", async ({ page }) => {
    // The directive stops click propagation inside the dropdown, so clicking a
    // non-interactive area of the list should not close it.
    await contentTypeList(page).click({ position: { x: 2, y: 2 }, force: true });
});

// --- Assertions ----------------------------------------------------------

Then('the "Create new" button should be visible', async ({ page }) => {
    await expect(createButton(page)).toBeVisible();
});

Then("the content type list should be hidden", async ({ page }) => {
    await expect(contentTypeList(page)).toHaveClass(/content-type-list--hidden/);
});

Then("the content type list should be shown", async ({ page }) => {
    await expect(contentTypeList(page)).not.toHaveClass(/content-type-list--hidden/);
});

Then("the content type list should remain shown", async ({ page }) => {
    await expect(contentTypeList(page)).not.toHaveClass(/content-type-list--hidden/);
});

Then("I should see the available content type options", async ({ page }) => {
    // Options render asynchronously from the format service, so wait for the
    // first one rather than reading count() immediately.
    await expect(contentTypeOptions(page).first()).toBeVisible();
});

Then('I should see an "Import Content" option', async ({ page }) => {
    await expect(importOption(page)).toBeVisible();
    await expect(importOption(page)).toContainText("Import Content");
});

Then("each option should show a content type icon", async ({ page }) => {
    const count = await contentTypeOptions(page).count();
    for (let i = 0; i < count; i++) {
        await expect(
            contentTypeOptions(page).nth(i).locator("[wf-icon]"),
        ).toHaveCount(1);
    }
});

Then("each option should show a content type label", async ({ page }) => {
    const count = await contentTypeOptions(page).count();
    for (let i = 0; i < count; i++) {
        await expect(
            contentTypeOptions(page).nth(i).locator(".dropdown-toolbar__item-title"),
        ).not.toBeEmpty();
    }
});

Then("I should see the standard article format", async ({ page }) => {
    await expect(
        contentTypeList(page).getByText("Article", { exact: true }),
    ).toBeVisible();
});

Then(/^I should see the non-article formats such as/, async ({ page }) => {
    for (const label of NON_ARTICLE_FORMATS) {
        await expect(
            contentTypeList(page).getByText(label, { exact: true }),
        ).toBeVisible();
    }
});

Then(
    "a stub creation should be requested for that content type",
    async ({ page }) => {
        await expect(stubModal(page)).toBeVisible();
    },
);

Then("the stub modal should open in create mode", async ({ page }) => {
    await expect(stubModal(page).locator(".modal-title")).toContainText("Create");
    await expect(stubModal(page).locator("#import_url")).toHaveCount(0);
});

Then("a content import should be requested", async ({ page }) => {
    await expect(stubModal(page)).toBeVisible();
});

Then("the stub modal should open in import mode", async ({ page }) => {
    await expect(stubModal(page).locator(".modal-title")).toContainText(
        "Import Existing Content",
    );
    await expect(stubModal(page).locator("#import_url")).toBeVisible();
});

// --- Feature-switch scenarios (pending) ----------------------------------
// These are tagged @fixme in the feature file: no content-type format is
// currently placed behind a feature switch (see
// public/lib/model/special-formats.ts), so there is nothing concrete to
// assert yet. Implement once a list element format is gated behind a switch.

Given(
    "a list element article format is behind a feature switch that is enabled",
    async () => {
        throw new Error("pending: no content-type format is behind a feature switch yet");
    },
);

Given(
    "a list element article format is behind a feature switch that is disabled",
    async () => {
        throw new Error("pending: no content-type format is behind a feature switch yet");
    },
);

Then(
    "that list element format should appear in the content type list",
    async () => {
        throw new Error("pending: no content-type format is behind a feature switch yet");
    },
);

Then(
    "that list element format should not appear in the content type list",
    async () => {
        throw new Error("pending: no content-type format is behind a feature switch yet");
    },
);
