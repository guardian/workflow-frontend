// User telemetry is mocked by a WireMock container (see startMockWiremock in
// e2e-tests/setup/stack/containers.ts and fixtures/telemetry/).
// The browser's cross-origin https calls reach it via Chromium
// host-resolver-rules. This module doesn't serve responses; it only lets tests
// read back the emitted events for assertions. A single container is shared
// across parallel workers, so each scenario tags its browser context with a
// unique header (see fixtures.ts) and queries only its own requests from
// WireMock's request journal.

import { SCENARIO_HEADER } from "./scenario";

/** A single telemetry event as sent by wfTelemetryService.sendTelemetryEvent. */
export type TelemetryEvent = {
    app: string;
    stage: string;
    eventTime: string;
    type: string;
    value: unknown;
    tags?: Record<string, unknown>;
};

/** Control surface returned by mockTelemetry for use in test assertions. */
export type TelemetryMock = {
    /** All events across this scenario's POST /event requests, in arrival order. */
    events: () => Promise<TelemetryEvent[]>;
};

// One WireMock logged request, as returned by POST /__admin/requests/find.
type LoggedRequest = { body?: string };

function parseEvents(body?: string): TelemetryEvent[] {
    if (!body) {
        return [];
    }
    try {
        const parsed = JSON.parse(body);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return [];
    }
}

export function mockTelemetry(
    mockTelemetryApiUrl: string,
    scenarioId: string,
): TelemetryMock {
    return {
        events: async () => {
            const response = await fetch(
                `${mockTelemetryApiUrl}/__admin/requests/find`,
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        method: "POST",
                        urlPath: "/event",
                        headers: { [SCENARIO_HEADER]: { equalTo: scenarioId } },
                    }),
                },
            );
            if (!response.ok) {
                throw new Error(
                    `Telemetry mock journal query failed: ${response.status}`,
                );
            }
            const { requests } = (await response.json()) as {
                requests: LoggedRequest[];
            };
            // WireMock returns newest-first; reverse to arrival order.
            return requests
                .flatMap((r) => parseEvents(r.body))
                .reverse();
        },
    };
}
