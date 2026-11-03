import { Given, When, Then, expect } from "./fixtures";

Given("I have opened the reporting validation page", async ({ page }) => {
    await page.setContent(`
        <h1>DO NOT MERGE: E2E media validation</h1>
        <label for="validation-message">Validation message</label>
        <input id="validation-message">
        <p role="status">Waiting for deliberate failure</p>
    `);
});

When("I enter {string} in the validation message", async ({ page }, message: string) => {
    await page.getByLabel("Validation message").fill(message);
});

Then("the reporting validation shows the intentionally incorrect status", async ({ page }) => {
    await expect(
        page.getByRole("status"),
        "Intentional failure to verify screenshots and first-retry traces/videos; DO NOT MERGE",
    ).toHaveText("This expectation is intentionally incorrect", { timeout: 1000 });
});