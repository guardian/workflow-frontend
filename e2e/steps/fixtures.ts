import fs from "fs";
import path from "path";
import { test as base, createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { createPanDomainCookie, type Role } from "../setup/panDomainCookie";
import type { SharedStackInfo } from "../setup/sharedStack";
import { ACTIVE_STACK_FILE } from "../globalSetup";
import { installPresenceMock, type PresenceMock } from "./support/presenceMock";

function readActiveStack(): SharedStackInfo {
    const filePath = path.join(process.cwd(), ACTIVE_STACK_FILE);
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as SharedStackInfo;
}

type StackFixtures = {
    /** Connection details of the local stack started in global setup. */
    stack: SharedStackInfo;
    /** Signs the browser context in via a pan-domain cookie for the given role. */
    signIn: (role?: Role) => Promise<void>;
    /** Per-scenario scratch space for sharing state between steps. */
    world: Record<string, unknown>;
    /** Mocked presence WebSocket, installed before navigation. */
    presence: PresenceMock;
};

export const test = base.extend<StackFixtures>({
    stack: async ({}, use) => {
        await use(readActiveStack());
    },
    world: async ({}, use) => {
        await use({});
    },
    presence: async ({ page }, use) => {
        await use(await installPresenceMock(page));
    },
    // Point every test at the stack started in global setup.
    baseURL: async ({ stack }, use) => {
        await use(stack.baseUrl);
    },
    signIn: async ({ context, stack }, use) => {
        await use(async (role: Role = "default") => {
            const cookie = createPanDomainCookie(stack.panDomainPrivateKey, role);
            await context.addCookies([
                {
                    name: "gutoolsAuth-assym",
                    value: cookie,
                    url: stack.baseUrl,
                },
            ]);
        });
    },
});

export { expect };
export const { Given, When, Then, Before } = createBdd(test);
