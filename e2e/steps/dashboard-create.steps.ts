import { Given, When, Then, expect } from "./fixtures";
import type { Page, Locator } from "@playwright/test";
import type { ComposerMock } from "../setup/mock/composerApiMock";

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
const contentListColumn = (page: Page): Locator =>
    page.locator(".content-list-column");

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

When("I choose {string} from the content type list", async ({ page }, contentTypeName: string) => {
    await contentTypeList(page)
        .locator("li.dropdown-toolbar__item")
        .filter({ hasText: contentTypeName })
        .click();
});

When("I fill in the stub form minimum required details", async ({ page, world }) => {
    await expect(stubModal(page)).toBeVisible();
    const title = `E2E test ${Date.now()}`;
    world.lastTitle = title;
    await stubModal(page).locator("#stub_title").fill(title);
    await stubModal(page).locator("#stub_section").selectOption({ index: 1 });
    // Fill commissioned length for content types that require it (field absent from DOM when not required).
    const lengthInput = stubModal(page).locator("input[name=commissionedLength]");
    if (await lengthInput.count() > 0) {
        await lengthInput.fill("500");
    }
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

Then("the stub modal should open with the title {string}", async ({ page }, expectedTitle: string) => {
    await expect(stubModal(page)).toBeVisible();
    await expect(stubModal(page).locator(".modal-title")).toContainText(expectedTitle);
});

Then("the commissioned length field should be visible", async ({ page }) => {
    await expect(stubModal(page).locator("input[name=commissionedLength]")).toBeVisible();
});

Then("the commissioned length field should not be visible", async ({ page }) => {
    await expect(stubModal(page).locator("input[name=commissionedLength]")).toHaveCount(0);
});

Then("the template selector should be visible", async ({ page }) => {
    await expect(stubModal(page).locator("#stub_template")).toBeVisible();
});

Then("the format dropdown should be visible", async ({ page }) => {
    await expect(stubModal(page).locator("#stub_format")).toBeVisible();
});

Then("the atom type selector should be visible", async ({ page }) => {
    await expect(stubModal(page).locator("#stub_content_type")).toBeVisible();
});

Then(
    "the Composer API should have received a request for content type {string}",
    async ({ composerMock }, expectedType: string) => {
        const mock = composerMock as ComposerMock;
        await expect.poll(() => mock.requests.length, { timeout: 5000 }).toBeGreaterThan(0);
        const lastRequest = mock.requests[mock.requests.length - 1];
        const url = new URL(lastRequest.request.url());
        expect(url.searchParams.get("type")).toBe(expectedType);
    },
);

Then(
    "the Composer API should have received a request with displayHint {string}",
    async ({ composerMock }, expectedDisplayHint: string) => {
        const mock = composerMock as ComposerMock;
        await expect.poll(() => mock.requests.length, { timeout: 5000 }).toBeGreaterThan(0);
        const lastRequest = mock.requests[mock.requests.length - 1];
        const url = new URL(lastRequest.request.url());
        expect(url.searchParams.get("displayHint")).toBe(expectedDisplayHint);
    },
);

// --- Creating a new piece from the stub modal ----------------------------

Given(
    "I have chosen a content type to open the stub modal in create mode",
    async ({ page }) => {
        // The composerMock fixture has already installed the Composer intercept;
        // template loading (on open) and content creation (on submit) both resolve.
        // Gallery has no commissioned-length requirement, so the form is valid
        // once a title and section are provided (no warnings block submission).
        await contentTypeList(page)
            .locator("li.dropdown-toolbar__item", { hasText: "Gallery" })
            .click();
        await expect(stubModal(page)).toBeVisible();
        await expect(stubModal(page).locator(".modal-title")).toContainText(
            "Create",
        );
    },
);

When("I fill in the new piece's details", async ({ page, world }) => {
    // A unique working title so the created row is unambiguous on the dashboard.
    const title = `E2E new piece ${Date.now()}`;
    world.newPieceTitle = title;

    await stubModal(page).locator("#stub_title").fill(title);

    // Pick the first real section (Angular prepends a blank option when the
    // model is unset); the section field is required for the form to validate.
    await stubModal(page).locator("#stub_section").selectOption({ index: 1 });
});

When("I submit the stub modal", async ({ page }) => {
    await stubModal(page).locator("#testing-create-in-composer").click();
});

Then("the new piece should be created", async ({ page }) => {
    // Successful creation swaps the form footer for the Composer confirmation.
    await expect(stubModal(page).locator("#testing-view-in-composer")).toBeVisible();
});

Then("the dashboard content list should refresh", async ({ page }) => {
    await expect(contentListColumn(page)).toBeVisible();
});

Then("I should see the new piece on the dashboard", async ({ page, world }) => {
    // Dismiss the confirmation to reveal the refreshed dashboard behind it.
    await stubModal(page).getByRole("button", { name: "Dismiss" }).click();
    const title = world.newPieceTitle as string;
    await expect(
        page.locator(`[data-cy="content-list-item-${title}"]`),
    ).toBeVisible();
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
