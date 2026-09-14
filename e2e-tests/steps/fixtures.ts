import { test as base, createBdd } from "playwright-bdd";
import type { StackConnection } from "../setup/types.js";
import { readActiveStackInfo } from "../setup/sharedStack.js";
import {
  createPanDomainCookie,
  PAN_DOMAIN_COOKIE_NAME,
  type Role,
} from "../setup/panDomainCookie.js";

type SignIn = (role?: Role) => Promise<void>;

interface Fixtures {
  stack: StackConnection;
  signIn: SignIn;
}

export const test = base.extend<Fixtures>({
  stack: async ({}, use) => {
    await use(readActiveStackInfo());
  },
  signIn: async ({ context, stack }, use) => {
    const signIn: SignIn = async (role = "default") => {
      const value = createPanDomainCookie(stack.panDomainPrivateKeyPem, role);
      await context.addCookies([
        {
          name: PAN_DOMAIN_COOKIE_NAME,
          value,
          url: stack.baseUrl,
        },
      ]);
    };
    await use(signIn);
  },
});

export const { Given, When, Then } = createBdd(test);
export { expect } from "@playwright/test";
