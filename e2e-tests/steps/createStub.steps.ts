import { Given, When, Then, expect } from "./fixtures";

const CREATE_NEW = "#testing-create-new";
// The `dropdown-toolbar__list` class is shared by several dashboard dropdowns, so
// scope to the "Create new" container.
const CONTENT_TYPE_LIST = ".dashboard-toolbar__dropdown--create ul.dropdown-toolbar__list";

async function openDropdown(page: import("@playwright/test").Page): Promise<void> {
  await page.locator(CREATE_NEW).click();
  await expect(page.locator(CONTENT_TYPE_LIST)).not.toHaveClass(/content-type-list--hidden/);
}

async function openStubModalFor(
  page: import("@playwright/test").Page,
  contentType: string,
): Promise<void> {
  await openDropdown(page);
  await page.locator(`#testing-dashboard-create-dropdown-${contentType}`).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

When("I open the {string} dropdown", async ({ page }, _name: string) => {
  await openDropdown(page);
});

Given("I have opened the {string} dropdown", async ({ page }, _name: string) => {
  await openDropdown(page);
});

Then("the content type list should be hidden", async ({ page }) => {
  await expect(page.locator(CONTENT_TYPE_LIST)).toHaveClass(/content-type-list--hidden/);
});

Then("the content type list should be visible", async ({ page }) => {
  await expect(page.locator(CONTENT_TYPE_LIST)).not.toHaveClass(/content-type-list--hidden/);
});

Then("I should see the {string} option", async ({ page }, label: string) => {
  await expect(page.getByText(label, { exact: true })).toBeVisible();
});

When("I choose the {string} content type", async ({ page }, contentType: string) => {
  await page.locator(`#testing-dashboard-create-dropdown-${contentType}`).click();
});

Given("I have opened the stub modal for a/an {string}", async ({ page }, contentType: string) => {
  await openStubModalFor(page, contentType);
});

Then("the stub modal should open with title {string}", async ({ page }, title: string) => {
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".modal-title")).toHaveText(title);
});

Then("the working title field should be empty", async ({ page }) => {
  await expect(page.locator("#stub_title")).toHaveValue("");
});

When("I cancel the stub modal", async ({ page }) => {
  await page.getByRole("button", { name: "Cancel" }).click();
});

Then("the stub modal should be closed", async ({ page }) => {
  await expect(page.getByRole("dialog")).toBeHidden();
});

When("I enter the working title {string}", async ({ page }, title: string) => {
  await page.locator("#stub_title").fill(title);
});

When("I select the {string} section", async ({ page }, section: string) => {
  await page.locator("#stub_section").selectOption({ label: section });
});

Then("the {string} section should be available", async ({ page }, section: string) => {
  await expect(
    page.locator("#stub_section option").filter({ hasText: section }),
  ).toHaveCount(1);
});

// In create mode the modal's primary button is "Create new" (#testing-create-in-composer);
// scope by id since the dashboard toolbar also has a "Create new" button.
Then("the create-content button should be enabled", async ({ page }) => {
  await expect(page.locator("#testing-create-in-composer")).toBeEnabled();
});
