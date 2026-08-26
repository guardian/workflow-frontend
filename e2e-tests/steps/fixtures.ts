import fs from "fs";
import path from "path";
import { test as base, createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { createPanDomainCookie, type Role } from "../setup/panDomainCookie";
import type { SharedStackInfo } from "../setup/sharedStack";
import { ACTIVE_STACK_FILE } from "../global-setup";
import { installPresenceMock, type PresenceMock, type PresencePerson, type PresenceLocation } from "./shared/presenceMock";
import { mockTelemetry, type TelemetryMock } from "./shared/telemetryMock";
import { mockComposer, type ComposerMock } from "./shared/composerApiMock";
import { SCENARIO_HEADER } from "./shared/scenario";
import { randomUUID } from "crypto";

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
    /** Unique id tagged onto every browser request so shared mock journals can be filtered per scenario. */
    scenarioId: string;
    /** Mocked presence client, installed before navigation. */
    presence: PresenceMock;
    /** Captures telemetry events emitted to the WireMock mock for assertions. */
    telemetry: TelemetryMock;
    /** Captures Composer content-create requests from the WireMock mock for assertions. */
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
    scenarioId: async ({ context }, use) => {
        const id = randomUUID();
        // Tag every request from this context so the shared mock containers'
        // request journals can be filtered to this scenario.
        await context.setExtraHTTPHeaders({ [SCENARIO_HEADER]: id });
        await use(id);
    },
    telemetry: async ({ stack, scenarioId }, use) => {
        await use(mockTelemetry(stack.mockTelemetryApiUrl, scenarioId));
    },
    composerMock: async ({ stack, scenarioId }, use) => {
        await use(mockComposer(stack.mockComposerApiUrl, scenarioId));
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
