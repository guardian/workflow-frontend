import { Before, Given, expect } from "./fixtures";

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


// --- Hook: install presence mocking before navigation --------------------

Before({ tags: "@presence" }, async ({ presence }) => {
    // Referencing the presence fixture installs the route mocks before the
    // Background navigates to the dashboard.
    void presence;
});

// --- Hook: tag Composer requests for capture before navigation --------------

Before({ tags: "@composer" }, async ({ composerMock }) => {
    // Referencing the composerMock fixture tags the browser context so the
    // WireMock mock's request journal can be filtered to this scenario.
    void composerMock;
});
