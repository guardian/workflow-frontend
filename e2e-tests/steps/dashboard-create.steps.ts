import { Given, When, Then, expect } from "./fixtures";
import type { Page, Locator } from "@playwright/test";
import type { ComposerMock } from "./shared/composerApiMock";

/**
 * Steps driving the dashboard "Create new" dropdown and the stub modal it opens.
 *
 * Evidence:
 * - public/layouts/dashboard/dashboard-create.html / .js — the dropdown toggle,
 *   the content-type option list and the create/import emitters.
 * - public/components/stub-modal/stub-modal.html / .js — the modal opened by the
 *   stub:create / content:import events, its title and field visibility rules.
 * - public/lib/content-service.js, public/lib/composer-service.js — the content
 *   creation flow and the Composer create request whose params we assert on.
 * - public/lib/model/{format-helpers,special-formats}.ts,
 *   public/lib/stub-form-validation.ts — the format labels and the
 *   commissioned-length requirement rules.
 */

// ── Dropdown locators ─────────────────────────────────────────────────────────
// Evidence: public/layouts/dashboard/dashboard-create.html

const createButton = (page: Page): Locator => page.locator("#testing-create-new");

// The list starts with class content-type-list--hidden; ng-class re-adds it
// whenever !showDropdown, so the class presence is the hidden/shown signal.
const contentTypeList = (page: Page): Locator =>
    page.locator("#testing-create-new + .dropdown-toolbar__list");

const contentTypeOptions = (page: Page): Locator =>
    contentTypeList(page).locator("li[ng-repeat] label.dropdown-toolbar__item-label");

const importOption = (page: Page): Locator =>
    page.locator("#testing-dashboard-create-dropdown-import");

// ids carry the option label verbatim (e.g. "Live blog"), so use an attribute
// selector to tolerate spaces and slashes that are invalid in a #id selector.
const optionByLabel = (page: Page, label: string): Locator =>
    page.locator(`[id="testing-dashboard-create-dropdown-${label}"]`);

// ── Stub modal locators ───────────────────────────────────────────────────────
// Evidence: public/components/stub-modal/stub-modal.html (windowClass "stubModal")

const modal = (page: Page): Locator => page.locator(".stubModal .modal-content");
const modalTitle = (page: Page): Locator => page.locator(".stubModal .modal-title");
const importUrlField = (page: Page): Locator => page.locator("#import_url");
const commissionedLengthField = (page: Page): Locator =>
    page.locator("form[name=stubForm] input[name=commissionedLength]");
const commissionedLengthSuggestion = (page: Page): Locator =>
    page.locator("button.commissioned-length-suggestion");
const templateSelector = (page: Page): Locator => page.locator("#stub_template");
const formatDropdown = (page: Page): Locator => page.locator("#stub_format");
const atomTypeSelector = (page: Page): Locator => page.locator("#stub_content_type");
const titleField = (page: Page): Locator => page.locator("#stub_title");
const sectionSelect = (page: Page): Locator => page.locator("#stub_section");
const createInComposerButton = (page: Page): Locator =>
    page.locator("#testing-create-in-composer");
const viewInComposerLink = (page: Page): Locator =>
    page.locator("#testing-view-in-composer");

// ── Helpers ───────────────────────────────────────────────────────────────────

const isListShown = async (page: Page): Promise<boolean> => {
    const cls = (await contentTypeList(page).getAttribute("class")) ?? "";
    return !cls.includes("content-type-list--hidden");
};

async function openDropdown(page: Page): Promise<void> {
    if (!(await isListShown(page))) {
        await createButton(page).click();
    }
    await expect
        .poll(() => isListShown(page))
        .toBe(true);
}

// Select the last real <option> of an ng-options select (skips any empty /
// unselected placeholder), which is enough to satisfy a `required` field.
async function selectLastOption(select: Locator): Promise<void> {
    const values = await select
        .locator("option")
        .evaluateAll((opts) =>
            (opts as HTMLOptionElement[])
                .map((o) => o.value)
                .filter((v) => v && v !== "" && v !== "?"),
        );
    await select.selectOption(values[values.length - 1]);
}

async function fillRequiredStubDetails(page: Page): Promise<string> {
    const title = `E2E create ${Date.now()}`;
    await titleField(page).fill(title);
    await selectLastOption(sectionSelect(page));
    // Commissioned length is only required for some content types; click the
    // first suggestion button when the section is present (Option B).
    if (await commissionedLengthSuggestion(page).first().isVisible()) {
        await commissionedLengthSuggestion(page).first().click();
    }
    return title;
}

// Read the query params of the most recent Composer content POST recorded by
// the composer mock's request journal (scoped to this scenario).
async function lastComposerParams(
    composerMock: ComposerMock,
): Promise<URLSearchParams | undefined> {
    const requests = await composerMock.contentRequests();
    return requests[requests.length - 1];
}

// ── The create dropdown is collapsed by default ───────────────────────────────

Given('I have not opened the "Create new" dropdown', async ({ page }) => {
    await expect.poll(() => isListShown(page)).toBe(false);
});

When("I look at the dashboard toolbar", async ({ page }) => {
    await expect(createButton(page)).toBeVisible();
});

Then('the "Create new" button should be visible', async ({ page }) => {
    await expect(createButton(page)).toBeVisible();
});

Then("the content type list should be hidden", async ({ page }) => {
    await expect.poll(() => isListShown(page)).toBe(false);
});

// ── Opening the dropdown reveals the content type options ──────────────────────

Given('the "Create new" dropdown is collapsed', async ({ page }) => {
    await expect.poll(() => isListShown(page)).toBe(false);
});

When('I click the "Create new" button', async ({ page }) => {
    await createButton(page).click();
});

Then("the content type list should be shown", async ({ page }) => {
    await expect.poll(() => isListShown(page)).toBe(true);
});

Then("I should see the available content type options", async ({ page }) => {
    await expect(contentTypeOptions(page).first()).toBeVisible();
});

Then('I should see an "Import Content" option', async ({ page }) => {
    await expect(importOption(page)).toBeVisible();
});

// ── Each option shows an icon and a label ──────────────────────────────────────

Given('the "Create new" dropdown is open', async ({ page }) => {
    await openDropdown(page);
});

When("I inspect the content type list", async ({ page }) => {
    await expect(contentTypeOptions(page).first()).toBeVisible();
});

Then("each option should show a content type icon", async ({ page }) => {
    const count = await contentTypeOptions(page).count();
    for (let i = 0; i < count; i++) {
        await expect(
            contentTypeOptions(page).nth(i).locator("i[wf-icon]"),
        ).toBeAttached();
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

// ── The options are loaded from the available formats ──────────────────────────

Given('I open the "Create new" dropdown', async ({ page }) => {
    await openDropdown(page);
});

When("the content type list loads", async ({ page }) => {
    await expect(contentTypeOptions(page).first()).toBeVisible();
});

Then("I should see the standard article format", async ({ page }) => {
    await expect(optionByLabel(page, "Article")).toBeVisible();
});

Then(
    "I should see the non-article formats such as {string}, {string}, {string}, {string}, {string} and {string}",
    async (
        { page },
        a: string,
        b: string,
        c: string,
        d: string,
        e: string,
        f: string,
    ) => {
        for (const label of [a, b, c, d, e, f]) {
            await expect.soft(optionByLabel(page, label)).toBeVisible();
        }
    },
);

// ── Choosing a content type opens the stub modal in create mode ────────────────

When("I choose a content type from the list", async ({ page }) => {
    await optionByLabel(page, "Article").click();
});

Then(
    "a stub creation should be requested for that content type",
    async ({ page }) => {
        // createContent() emits stub:create, which the stub modal listens for and
        // opens in create mode.
        await expect(modal(page)).toBeVisible();
        await expect(modalTitle(page)).toHaveText(/^Create /);
    },
);

Then("the stub modal should open in create mode", async ({ page }) => {
    await expect(modal(page)).toBeVisible();
    await expect(importUrlField(page)).toBeHidden();
});

// ── Creating a new piece adds it to the dashboard content list (@composer) ─────

Given(
    "I have chosen a content type to open the stub modal in create mode",
    async ({ page }) => {
        await openDropdown(page);
        await optionByLabel(page, "Article").click();
        await expect(modal(page)).toBeVisible();
    },
);

When("I fill in the new piece's details", async ({ page, world }) => {
    world.newPieceTitle = await fillRequiredStubDetails(page);
});

When("I submit the stub modal", async ({ page }) => {
    await createInComposerButton(page).click();
});

Then("the new piece should be created", async ({ page }) => {
    // On success the modal swaps to the "View in Composer" footer.
    await expect(viewInComposerLink(page)).toBeVisible();
});

Then("the dashboard content list should refresh", async ({ page }) => {
    // ok() broadcasts 'getContent' on success; the success footer link is the
    // observable signal that the create completed and the refresh was triggered.
    await expect(viewInComposerLink(page)).toBeVisible();
});

Then("I should see the new piece on the dashboard", async ({ page, world }) => {
    // Dismiss the success footer to return to the dashboard, then find the row.
    await page.locator(".stubModal").getByRole("button", { name: "Dismiss" }).click();
    await expect(
        page.locator("table.content-list").getByText(world.newPieceTitle ?? ""),
    ).toBeVisible();
});

// ── Choosing Import Content opens the stub modal in import mode ─────────────────

When("I choose the {string} option", async ({ page }, label: string) => {
    if (label === "Import Content") {
        await importOption(page).click();
        return;
    }
    await optionByLabel(page, label).click();
});

Then("a content import should be requested", async ({ page }) => {
    // importContent() emits content:import, which opens the modal in import mode.
    await expect(modal(page)).toBeVisible();
    await expect(importUrlField(page)).toBeVisible();
});

Then("the stub modal should open in import mode", async ({ page }) => {
    await expect(modal(page)).toBeVisible();
    await expect(importUrlField(page)).toBeVisible();
});

// ── Field visibility per format ────────────────────────────────────────────────

When(
    "I choose {string} from the content type list",
    async ({ page }, label: string) => {
        await optionByLabel(page, label).click();
    },
);

Then(
    "the stub modal should open with the title {string}",
    async ({ page }, title: string) => {
        await expect(modal(page)).toBeVisible();
        await expect(modalTitle(page)).toHaveText(title);
    },
);

Then("the commissioned length field should be visible", async ({ page }) => {
    await expect(commissionedLengthField(page)).toBeVisible();
});

Then("the template selector should be visible", async ({ page }) => {
    await expect(templateSelector(page)).toBeVisible();
});

Then("the format dropdown should be visible", async ({ page }) => {
    await expect(formatDropdown(page)).toBeVisible();
});

Then("the commissioned length field should not be visible", async ({ page }) => {
    await expect(commissionedLengthField(page)).toBeHidden();
});

Then("the atom type selector should be visible", async ({ page }) => {
    await expect(atomTypeSelector(page)).toBeVisible();
});

// ── Creating content sends the correct params to the Composer API (@composer) ──

When("I fill in the stub form minimum required details", async ({ page }) => {
    await fillRequiredStubDetails(page);
});

Then(
    "the Composer API should have received a request for content type {string}",
    async ({ composerMock }, composerType: string) => {
        await expect
            .poll(async () => (await lastComposerParams(composerMock))?.get("type"))
            .toBe(composerType);
    },
);

Then(
    "the Composer API should have received a request with displayHint {string}",
    async ({ composerMock }, displayHint: string) => {
        await expect
            .poll(async () => (await lastComposerParams(composerMock))?.get("displayHint"))
            .toBe(displayHint);
    },
);

// ── Dropdown closing behaviour ─────────────────────────────────────────────────

When("I click elsewhere on the page", async ({ page }) => {
    // The document click handler in wfDropdownToggle closes the dropdown.
    await page.locator("body").click({ position: { x: 1, y: 1 } });
});

When("I click inside the dropdown", async ({ page }) => {
    // The dropdown container stops click propagation, so a click on non-option
    // chrome must not reach the document handler.
    await contentTypeList(page).click({ position: { x: 1, y: 1 } });
});

Then("the content type list should remain shown", async ({ page }) => {
    await expect.poll(() => isListShown(page)).toBe(true);
});

When('I click the "Create new" button again', async ({ page }) => {
    await createButton(page).click();
});
