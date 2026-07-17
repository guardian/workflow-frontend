import type { Page, WebSocketRoute } from "@playwright/test";

/**
 * Mocks the Guardian presence service for e2e tests.
 *
 * The real presence flow is: the app loads an external client library
 * (`<script src="…/client/1/lib.js">`) which exposes `window.presenceClient`,
 * then opens a WebSocket to `config.presenceUrl` (wss://presence.<domain>/socket)
 * and dispatches `visitor-list-updated` / `visitor-list-subscribe` messages to
 * handlers the app registers (see public/lib/presence.js).
 *
 * Neither the library nor the socket are reachable from the local stack, so we:
 *   1. Fulfil the client-library request with a tiny stub that speaks a simple
 *      JSON protocol over a real WebSocket.
 *   2. Intercept that WebSocket with Playwright's WebSocketRoute and act as the
 *      server, pushing presence state on demand from the tests.
 */

export type PresenceMock = {
    /** Resolves once the app has connected to the mocked presence socket. */
    ready: Promise<void>;
    /** Push a presence update for a content id (its composerId/subscriptionId). */
    pushStatus: (subscriptionId: string, currentState: unknown[]) => Promise<void>;
};

// Stub for `window.presenceClient`. Speaks a minimal JSON protocol to the
// WebSocketRoute mock: it forwards `visitor-list-*` frames straight to the
// handlers the app registers, and resolves its connection promise on open.
const CLIENT_LIB_JS = `
(function () {
  window.presenceClient = function (endpoint, person) {
    var listeners = {};
    var handlers = {};
    var ws;
    var resolveOpen;
    var openPromise = new Promise(function (res) { resolveOpen = res; });

    function emit(event) {
      (listeners[event] || []).forEach(function (cb) {
        try { cb(); } catch (e) {}
      });
    }

    return {
      connectionId: "e2e-" + Math.random().toString(36).slice(2),
      on: function (event, cb) {
        (listeners[event] = listeners[event] || []).push(cb);
      },
      register: function (type, handler) {
        handlers[type] = handler;
      },
      subscribe: function (ids) {
        try {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "subscribe", ids: ids || [] }));
          }
        } catch (e) {}
        return Promise.resolve();
      },
      startConnection: function () {
        ws = new WebSocket(endpoint);
        ws.onopen = function () {
          emit("connection.open");
          resolveOpen();
        };
        ws.onmessage = function (event) {
          var msg;
          try { msg = JSON.parse(event.data); } catch (e) { return; }
          var handler = handlers[msg.type];
          if (handler) { handler(msg); }
        };
        return openPromise;
      }
    };
  };
})();
`;

export async function installPresenceMock(page: Page): Promise<PresenceMock> {
    let activeRoute: WebSocketRoute | undefined;
    let resolveReady!: () => void;
    const ready = new Promise<void>((resolve) => {
        resolveReady = resolve;
    });

    // Serve our stub instead of the (unreachable) external presence client lib.
    await page.route("**/client/1/lib.js", async (route) => {
        await route.fulfill({
            contentType: "application/javascript",
            body: CLIENT_LIB_JS,
        });
    });

    // Intercept the presence WebSocket and act as the server (no real backend).
    await page.routeWebSocket("**/socket", (ws) => {
        activeRoute = ws;
        // We don't need to react to the app's subscribe frames for these tests.
        ws.onMessage(() => {});
        resolveReady();
    });

    return {
        ready,
        async pushStatus(subscriptionId, currentState) {
            await ready;
            activeRoute?.send(
                JSON.stringify({
                    type: "visitor-list-updated",
                    subscriptionId,
                    currentState,
                }),
            );
        },
    };
}
