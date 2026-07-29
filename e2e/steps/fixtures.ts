import fs from "fs";
import path from "path";
import { test as base, createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { createPanDomainCookie, type Role } from "../setup/panDomainCookie";
import type { SharedStackInfo } from "../setup/sharedStack";
import { ACTIVE_STACK_FILE } from "../globalSetup";
import { installPresenceMock, type PresenceMock, type PresencePerson, type PresenceLocation } from "../setup/mock/presenceMock";
import { mockTelemetry, type TelemetryMock } from "../setup/mock/telemetryMock";
import { mockComposer, type ComposerMock } from "../setup/mock/composerApiMock";

function readActiveStack(): SharedStackInfo {
    const filePath = path.join(__dirname, "..", ACTIVE_STACK_FILE);
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as SharedStackInfo;
}
export type PersonWithLocation = { person: PresencePerson; location: PresenceLocation };

export type World = {
    people?: PersonWithLocation[];
    mode?: "list" | "drawer";
    stubId?: string;
    composerId?: string;
    lastTitle?: string;
    newPieceTitle?: string;
    /** Set to true by dialog-intercept steps to verify a browser dialog was shown. */
    dialogSeen?: boolean;
};

type StackFixtures = {
    /** Connection details of the local stack started in global setup. */
    stack: SharedStackInfo;
    /** Signs the browser context in via a pan-domain cookie for the given role. */
    signIn: (role?: Role) => Promise<void>;
    /** Per-scenario scratch space for sharing state between steps. */
    world: World;
    /** Mocked presence client, installed before navigation. */
    presence: PresenceMock;
    /** Mocked telemetry service, capturing emitted events for assertions. */
    telemetry: TelemetryMock;
    /** Mocked Composer API, intercepting content creation and template calls. */
    composerMock: ComposerMock;
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
    telemetry: async ({ page }, use) => {
        await use(await mockTelemetry(page));
    },
    composerMock: async ({ page }, use) => {
        await use(await mockComposer(page));
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
