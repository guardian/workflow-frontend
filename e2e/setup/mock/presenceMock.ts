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
 *   1. Fulfil the client-library request with a tiny in-memory stub that
 *      implements the `presenceClient` contract entirely on the client. No
 *      network/socket is involved — `startConnection()` resolves immediately.
 *   2. The stub records the app's `visitor-list-updated` handler on a control
 *      object (`window.__presenceMock__`) so tests can drive presence updates by
 *      invoking that handler directly from the Playwright side.
 */

/** The current user, passed by the app to the presence client factory. */
type PresencePerson = {
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
type PresenceEntry = {
    clientId: {
        person: PresencePerson;
    };
    locations?: PresenceLocation[];
    location?: PresenceLocation;
};

type PresenceLocation = "body" | "document" | "furniture" | "idle" | "invalid";

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

// In-memory stub for the presence client library. Injected in place of the
// (unreachable) external `client/1/lib.js`. It fulfils the `presenceClient`
// contract without any network: `startConnection()` resolves synchronously and
// the registered `visitor-list-updated` handler is exposed on
// `window.__presenceMock__` so tests can invoke it directly.
const CLIENT_LIB_JS = `
(function () {
  window.presenceClient = function (endpoint, person) {
    var handlers = {};

    function register(event, handler) {
      handlers[event] = handler;
    }

    var connection = {
      connectionId: "e2e-" + Math.random().toString(36).slice(2),
      on: register,
      register: register,
      subscribe: function () {
        return Promise.resolve();
      },
      startConnection: function () {
        window.__presenceMock__ = {
          connected: true,
          push: function (subscriptionId, currentState) {
            var handler = handlers["visitor-list-updated"];
            if (handler) {
              handler({
                type: "visitor-list-updated",
                subscriptionId: subscriptionId,
                currentState: currentState
              });
            }
          }
        };
        if (handlers["connection.open"]) {
          handlers["connection.open"]();
        }
        return Promise.resolve(this);
      }
    };

    return connection;
  };
})();
`;

export async function installPresenceMock(page: Page): Promise<PresenceMock> {
    // Serve our stub instead of the (unreachable) external presence client lib.
    await page.route("**/client/1/lib.js", async (route) => {
        await route.fulfill({
            contentType: "application/javascript",
            body: CLIENT_LIB_JS,
        });
    });

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
