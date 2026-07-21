import { Given, When, Then, Before, expect } from "./fixtures";
import { DataTable } from "playwright-bdd";
import type { Page, Locator } from "@playwright/test";
import type { PresenceMock } from "../setup/mock/presenceMock";

/**
 * These steps drive the real presence indicators rendered on content-list rows.
 * Presence state is injected through the mocked presence client (see
 * ./support/presenceMock.ts) and validated by reading the actual DOM.
 */

// Content items served by the mock datastore (e2e/fixtures/datastore-responses/
// workflow-list.json). We target them by row id (`#stub-<id>`) and push presence
// for their composerId (the presence subscription id).
const CONTENT = {
    primary: { stubId: 66080, composerId: "6942e9ec8f08c24dd46036a8" },
    other: { stubId: 66081, composerId: "6a3411798f0821a7fcc11108" },
    liveblog: { stubId: 66082, composerId: "6a5b1c2d8f0800000000abcd" },
} as const;

type Activity = "editing body" | "document" | "editing furniture" | "idle";

interface Person {
    firstName: string;
    lastName: string;
    email: string;
    activity: Activity;
}

const DEFAULT_PERSON = {
    firstName: "Ada",
    lastName: "Byte",
    email: "ada.byte@guardian.co.uk",
};

function locationsFor(activity: Activity): string[] {
    switch (activity) {
        case "editing body":
            return ["body"];
        case "document":
            return ["document"];
        case "editing furniture":
            return ["furniture"];
        case "idle":
            return [];
    }
}

function entriesFor(people: Person[]) {
    return people.map((p) => ({
        clientId: {
            person: {
                firstName: p.firstName,
                lastName: p.lastName,
                email: p.email,
            },
        },
        locations: locationsFor(p.activity),
    }));
}

function nameToPerson(name: string): { firstName: string; lastName: string; email: string } {
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    const emailLocal = [firstName, lastName || firstName]
        .join(".")
        .toLowerCase()
        .replace(/\s+/g, ".");
    return { firstName, lastName, email: `${emailLocal}@guardian.co.uk` };
}

function initialsOf(person: { firstName: string; lastName: string }): string {
    return (person.firstName.charAt(0) + person.lastName.charAt(0)).toUpperCase();
}

// --- World helpers -------------------------------------------------------

function getPeople(world: Record<string, unknown>): Person[] {
    return (world.people as Person[] | undefined) ?? [];
}

function setContent(
    world: Record<string, unknown>,
    key: keyof typeof CONTENT = "primary",
): void {
    world.stubId = CONTENT[key].stubId;
    world.composerId = CONTENT[key].composerId;
}

// --- DOM helpers ---------------------------------------------------------

const drawerRoot = (page: Page): Locator =>
    page.locator("tr.content-list-drawer:not(.content-list-drawer--hidden)");

/** The <wf-presence-indicators> element for the current scope (row or drawer). */
function scope(page: Page, world: Record<string, unknown>): Locator {
    if (world.mode === "drawer") {
        return drawerRoot(page).locator("wf-presence-indicators[in-drawer]");
    }
    return page.locator(`#stub-${world.stubId} wf-presence-indicators`);
}

const nobody = (page: Page, world: Record<string, unknown>): Locator =>
    scope(page, world).locator(".drawer__section-data-row--coming-soon");
const anyIcon = (page: Page, world: Record<string, unknown>): Locator =>
    scope(page, world).locator("a.content-list-item__icon--presence");
const nonFreeItems = (page: Page, world: Record<string, unknown>): Locator =>
    scope(page, world).locator("li:not(.content-list-item__presence--free)");
const iconByStatus = (
    page: Page,
    world: Record<string, unknown>,
    status: string,
): Locator =>
    scope(page, world).locator(
        `li.content-list-item__presence--${status} a.content-list-item__icon--presence`,
    );

async function openDrawer(page: Page, stubId: number): Promise<void> {
    await page.locator(`#stub-${stubId}`).click({ position: { x: 5, y: 5 } });
    await expect(drawerRoot(page)).toBeVisible();
    // The presence "In use by" field lives in the collapsible "management"
    // section, which is closed by default (the "furniture" section opens
    // first). Open it so the presence indicators become visible.
    await drawerRoot(page).locator('[data-cy="management-drawer"]').click();
    await expect(
        drawerRoot(page).locator("wf-presence-indicators[in-drawer]"),
    ).toBeVisible();
}

async function view(
    page: Page,
    world: Record<string, unknown>,
    presence: PresenceMock,
    mode: "list" | "drawer",
): Promise<void> {
    world.mode = mode;
    const stubId = world.stubId as number;
    await page.locator(`#stub-${stubId}`).waitFor({ state: "attached" });
    if (mode === "drawer") {
        await openDrawer(page, stubId);
    }
    await presence.pushStatus(world.composerId as string, entriesFor(getPeople(world)));
}

// --- Hook: install presence mocking before navigation --------------------

Before({ tags: "@presence" }, async ({ presence }) => {
    // Referencing the presence fixture installs the route mocks before the
    // Background navigates to the dashboard.
    void presence;
});

// --- Preconditions -------------------------------------------------------

Given("a piece of content has no active presence", async ({ world }) => {
    setContent(world);
    world.people = [];
});

Given("a colleague is editing the body of a piece of content", async ({ world }) => {
    setContent(world);
    world.people = [{ ...DEFAULT_PERSON, activity: "editing body" }];
});

Given(
    "a colleague is present on a piece of content at the document location",
    async ({ world }) => {
        setContent(world);
        world.people = [{ ...DEFAULT_PERSON, activity: "document" }];
    },
);

Given(
    "a colleague is present on a piece of content editing only its furniture",
    async ({ world }) => {
        setContent(world);
        world.people = [{ ...DEFAULT_PERSON, activity: "editing furniture" }];
    },
);

Given(
    "a colleague is present on a piece of content but not editing the body or furniture",
    async ({ world }) => {
        setContent(world);
        world.people = [{ ...DEFAULT_PERSON, activity: "idle" }];
    },
);

Given("a colleague is idle on a live blog", async ({ world }) => {
    setContent(world, "liveblog");
    world.people = [{ ...DEFAULT_PERSON, activity: "idle" }];
});

Given(
    "a colleague named {string} is present on a piece of content",
    async ({ world }, name: string) => {
        setContent(world);
        world.people = [{ ...nameToPerson(name), activity: "editing body" }];
    },
);

Given(
    "a colleague with email {string} is present on a piece of content",
    async ({ world }, email: string) => {
        setContent(world);
        world.people = [{ ...DEFAULT_PERSON, email, activity: "editing body" }];
    },
);

Given(
    "a colleague named {string} with email {string} is editing the body of a piece of content",
    async ({ world }, name: string, email: string) => {
        setContent(world);
        world.people = [{ ...nameToPerson(name), email, activity: "editing body" }];
    },
);

Given(
    "the following colleagues are present on a piece of content:",
    async ({ world }, table: DataTable) => {
        setContent(world);
        world.people = table.hashes().map((row) => ({
            ...nameToPerson(row.name),
            activity: row.activity as Activity,
        }));
    },
);

Given(
    "a colleague is present on a piece of content from more than one session",
    async ({ world }) => {
        setContent(world);
        // Two sessions for the same person (same email) — should be de-duped.
        world.people = [
            { ...DEFAULT_PERSON, activity: "editing body" },
            { ...DEFAULT_PERSON, activity: "idle" },
        ];
    },
);

Given(
    "I am viewing the presence indicators for a piece of content",
    async ({ page, world, presence }) => {
        setContent(world);
        world.people = [];
        world.mode = "list";
        await page.locator(`#stub-${world.stubId}`).waitFor({ state: "attached" });
        await presence.pushStatus(world.composerId as string, []);
    },
);

// --- Actions -------------------------------------------------------------

When(
    "I view its presence indicators in the drawer",
    async ({ page, world, presence }) => {
        await view(page, world, presence, "drawer");
    },
);

When(
    "I view its presence indicators in the content list",
    async ({ page, world, presence }) => {
        await view(page, world, presence, "list");
    },
);

When("I view its presence indicators", async ({ page, world, presence }) => {
    await view(page, world, presence, "list");
});

When(
    "a presence update arrives for that content",
    async ({ page, world, presence }) => {
        const person: Person = {
            firstName: "Liv",
            lastName: "Update",
            email: "liv.update@guardian.co.uk",
            activity: "editing body",
        };
        world.people = [person];
        await page.locator(`#stub-${world.stubId}`).waitFor({ state: "attached" });
        await presence.pushStatus(world.composerId as string, entriesFor([person]));
    },
);

When(
    "a presence update arrives for a different piece of content",
    async ({ presence }) => {
        const person: Person = {
            firstName: "Liv",
            lastName: "Update",
            email: "liv.update@guardian.co.uk",
            activity: "editing body",
        };
        await presence.pushStatus(CONTENT.other.composerId, entriesFor([person]));
    },
);

// --- Assertions ----------------------------------------------------------

Then('I should see a "Nobody" placeholder', async ({ page, world }) => {
    await expect(nobody(page, world)).toBeVisible();
    await expect(nobody(page, world)).toHaveText("Nobody");
});

Then("I should not see any presence icons", async ({ page, world }) => {
    await expect(nonFreeItems(page, world)).toHaveCount(0);
});

Then('I should not see the "Nobody" placeholder', async ({ page, world }) => {
    // The placeholder is only shown in the drawer, so in the content list the
    // span is present in the DOM but hidden via ng-show.
    await expect(nobody(page, world)).toBeHidden();
});

Then("I should not see any visible presence icon", async ({ page, world }) => {
    await expect(nonFreeItems(page, world)).toHaveCount(0);
});

Then("I should see a presence icon marked as present", async ({ page, world }) => {
    await expect(iconByStatus(page, world, "present")).toHaveCount(1);
});

Then("I should see a presence icon marked as furniture", async ({ page, world }) => {
    await expect(iconByStatus(page, world, "furniture")).toHaveCount(1);
});

Then("I should see a presence icon marked as idle", async ({ page, world }) => {
    await expect(iconByStatus(page, world, "idle")).toHaveCount(1);
});

Then("the icon should show their initials", async ({ page, world }) => {
    const person = getPeople(world)[0];
    await expect(iconByStatus(page, world, "present")).toHaveText(initialsOf(person));
});

Then("its title should describe them as editing body", async ({ page, world }) => {
    await expect(iconByStatus(page, world, "present")).toHaveAttribute(
        "title",
        /editing body$/,
    );
});

Then(
    "its title should describe them as editing furniture",
    async ({ page, world }) => {
        await expect(iconByStatus(page, world, "furniture")).toHaveAttribute(
            "title",
            /editing furniture$/,
        );
    },
);

Then("its title should describe them as idle", async ({ page, world }) => {
    await expect(iconByStatus(page, world, "idle")).toHaveAttribute("title", /idle$/);
});

Then(
    "the presence icon should show the initials {string}",
    async ({ page, world }, initials: string) => {
        await expect(iconByStatus(page, world, "present")).toHaveText(initials);
    },
);

Then(
    "the presence icon should show the full name {string}",
    async ({ page, world }, fullName: string) => {
        await expect(iconByStatus(page, world, "present")).toHaveText(fullName);
    },
);

Then(
    "the presence icon should link to {string}",
    async ({ page, world }, href: string) => {
        await expect(iconByStatus(page, world, "present")).toHaveAttribute("href", href);
    },
);

Then(
    "the icon title should be {string}",
    async ({ page, world }, title: string) => {
        await expect(iconByStatus(page, world, "present")).toHaveAttribute("title", title);
    },
);

Then(
    "the presence icons should be ordered present, then furniture, then idle",
    async ({ page, world }) => {
        const statuses = await scope(page, world)
            .locator('li[class*="content-list-item__presence--"]')
            .evaluateAll((els) =>
                els
                    .map((el) => {
                        const match = el.className.match(
                            /content-list-item__presence--(\w+)/,
                        );
                        return match ? match[1] : "";
                    })
                    .filter((s) => s && s !== "free"),
            );
        expect(statuses).toEqual(["present", "furniture", "idle"]);
    },
);

Then(
    "I should see a single presence icon for that person",
    async ({ page, world }) => {
        await expect(anyIcon(page, world)).toHaveCount(1);
    },
);

Then("the presence indicators should update to match", async ({ page, world }) => {
    await expect(iconByStatus(page, world, "present")).toHaveText("LU");
});

Then("the presence indicators should not change", async ({ page, world }) => {
    // The update was for a different content id, so this row stays empty.
    await expect(nonFreeItems(page, world)).toHaveCount(0);
});
