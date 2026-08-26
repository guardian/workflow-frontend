import type { Page } from "@playwright/test";

/**
 * Mocks the Guardian presence service for e2e tests.
 *
 * The real presence flow is: the app loads an external client library
 * (`<script src="…/client/1/lib.js">`) which exposes `window.presenceClient`,
 * then opens a WebSocket to `config.presenceUrl` and dispatches
 * `visitor-list-updated` / `visitor-list-subscribe` messages to handlers the app
 * registers via `presence.register(...)` (see public/lib/presence.js).
 *
 * Rather than emulate the WebSocket, we mock around the `presenceClient`
 * interface itself:
 *   1. The mock-presence WireMock container serves a tiny in-memory stub in
 *      place of the real `client/1/lib.js`, implementing the `presenceClient`
 *      contract entirely on the client. No network/socket is involved —
 *      `startConnection()` resolves immediately.
 *   2. The stub records the app's `visitor-list-updated` handler on a control
 *      object (`window.__presenceMock__`) so tests can drive presence updates by
 *      invoking that handler directly from the Playwright side.
 */

/** The current user, passed by the app to the presence client factory. */
export type PresencePerson = {
    firstName: string;
    lastName: string;
    email: string;
};

/**
 * A single person's presence within a subscription's `currentState`, as consumed
 * by public/components/presence-indicator/presence-indicators.js. `locations`
 * (and the optional singular `location`) drive the rendered status: "body" /
 * "document" => present, "furniture" => furniture, otherwise => idle.
 */
export type PresenceEntry = {
    clientId: {
        person: PresencePerson;
    };
    locations?: PresenceLocation[];
    location?: PresenceLocation;
};

export type PresenceLocation = "body" | "document" | "furniture" | "idle" | "invalid";

/** A presence message pushed to a registered handler. */
type PresenceMessage = {
    type: string;
    subscriptionId: string;
    currentState: PresenceEntry[];
};

/** Handler registered by the app for a connection event or message type. */
type PresenceHandler = (message?: PresenceMessage) => void;

/**
 * The object returned by `window.presenceClient(endpoint, person)`. This mirrors
 * the subset of the real presence client that public/lib/presence.js relies on.
 * `on` and `register` are aliases: both register a handler for a named event.
 */
type PresenceConnection = {
    connectionId: string;
    on: (event: string, handler: PresenceHandler) => void;
    register: (event: string, handler: PresenceHandler) => void;
    subscribe: (ids: string[]) => Promise<void>;
    startConnection: () => Promise<PresenceConnection>;
};

/** The factory the app reads from `window.presenceClient`. */
type PresenceClientFactory = (
    endpoint: string,
    person: PresencePerson,
) => PresenceConnection;

/**
 * Control surface the browser-side stub exposes so the Playwright side can drive
 * presence updates and observe connection readiness.
 */
type PresenceMockControl = {
    connected: boolean;
    push: (subscriptionId: string, currentState: PresenceEntry[]) => void;
};

declare global {
    interface Window {
        presenceClient?: PresenceClientFactory;
        __presenceMock__?: PresenceMockControl;
    }
}

export type PresenceMock = {
    /** Resolves once the app has "connected" to the mocked presence client. */
    ready: Promise<void>;
    /** Push a presence update for a content id (its composerId/subscriptionId). */
    pushStatus: (subscriptionId: string, currentState: PresenceEntry[]) => Promise<void>;
};

export async function installPresenceMock(page: Page): Promise<PresenceMock> {
    // The stub client library is served by the mock-presence WireMock container
    // (routed to the browser via host-resolver-rules); it exposes
    // window.__presenceMock__ once the app has "connected".
    const ready = page
        .waitForFunction(() => window.__presenceMock__?.connected === true)
        .then(() => undefined);

    return {
        ready,
        async pushStatus(subscriptionId, currentState) {
            await ready;
            await page.evaluate(
                ([id, state]) => {
                    window.__presenceMock__?.push(id as string, state as PresenceEntry[]);
                },
                [subscriptionId, currentState] as const,
            );
        },
    };
}
