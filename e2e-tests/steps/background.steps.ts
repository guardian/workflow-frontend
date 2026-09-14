import { Given, expect } from "./fixtures";

Given("the application stack is running", async ({ stack }) => {
  expect(stack.baseUrl).toBeTruthy();
});

Given("I am signed in through pan-domain auth", async ({ signIn }) => {
  await signIn("default");
});

Given("I have opened the workflow dashboard", async ({ page, stack }) => {
  await page.goto(`${stack.baseUrl}/dashboard`);
});
