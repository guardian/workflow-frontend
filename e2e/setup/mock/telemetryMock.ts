// The Guardian user-telemetry service is not reachable from the local stack, so
// intercept the cross-origin requests the app makes to it. There are two
// channels:
//   1. Structured events: `fetch` POST to `${telemetryUrl}/event` with a JSON
//      array of events (see @guardian/user-telemetry-client). Sending is
//      throttled ~10s by the client, so events may not arrive immediately.
//   2. A tracking pixel: `new Image().src = .../guardian-tool-accessed?...`
//      (public/tracking-pixel.js), fired on page load.
//
// We fulfil both with a 200 and record each intercepted request so tests can
// assert on the telemetry the app emitted.

import { Page, Request } from "@playwright/test";

/** A single telemetry event as sent by wfTelemetryService.sendTelemetryEvent. */
export type TelemetryEvent = {
    app: string;
    stage: string;
    eventTime: string;
    type: string;
    value: unknown;
    tags?: Record<string, unknown>;
};

/** A telemetry request recorded by the mock. */
export type CapturedTelemetryRequest = {
    /** The full request URL. */
    url: string;
    /** HTTP method (POST for /event, GET for the tracking pixel). */
    method: string;
    /** Parsed events for POST /event requests; empty for the tracking pixel. */
    events: TelemetryEvent[];
    /** The underlying Playwright request (valid only during the test run). */
    request: Request;
};

/** Control surface returned by mockTelemetry for use in test assertions. */
export type TelemetryMock = {
    /** Every telemetry request intercepted so far, in arrival order. */
    requests: CapturedTelemetryRequest[];
    /** All events across every intercepted POST /event request, flattened. */
    events: () => TelemetryEvent[];
    /** Reset the captured request list (e.g. between assertions). */
    clear: () => void;
};

export async function mockTelemetry(page: Page): Promise<TelemetryMock> {
    const requests: CapturedTelemetryRequest[] = [];

    await page.route(/^https:\/\/user-telemetry\.[^/]+\//, async (route) => {
        const request = route.request();
        const cors: Record<string, string> = {
            "access-control-allow-origin": request.headers()["origin"] ?? "*",
            "access-control-allow-credentials": "true",
            "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
            "access-control-allow-headers":
                request.headers()["access-control-request-headers"] ?? "content-type",
        };

        // CORS preflight: acknowledge without recording.
        if (request.method() === "OPTIONS") {
            await route.fulfill({ status: 204, headers: cors });
            return;
        }

        let events: TelemetryEvent[] = [];
        if (request.method() === "POST") {
            const body = request.postData();
            if (body) {
                try {
                    const parsed = JSON.parse(body);
                    events = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    // Leave events empty if the body is not valid JSON.
                }
            }
        }

        requests.push({
            url: request.url(),
            method: request.method(),
            events,
            request,
        });

        await route.fulfill({
            status: 200,
            headers: { ...cors, "content-type": "application/json" },
            body: "[]",
        });
    });

    return {
        requests,
        events: () => requests.flatMap((r) => r.events),
        clear: () => {
            requests.length = 0;
        },
    };
}
