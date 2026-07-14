import { Given, expect } from "./fixtures";

/**
 * Shared Background steps used by every feature.
 *
 * Background:
 *   Given the application stack is running
 *   And I am signed in through pan-domain auth
 *   And I have opened <the relevant page>
 */

Given("the application stack is running", async ({ stack }) => {
    expect(stack.baseUrl).toBeTruthy();
});

Given("I am signed in through pan-domain auth", async ({ signIn }) => {
    await signIn();
});

Given("I have opened the workflow dashboard", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
});
