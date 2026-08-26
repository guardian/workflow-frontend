
// Composer is mocked by a WireMock container (see e2e-tests/images/mock-composer.Dockerfile
// and fixtures/composer-mappings/). The browser's cross-origin https calls reach it via
// Chromium host-resolver-rules. This module doesn't serve responses; it only lets tests read
// back the content-create requests for assertions. Because a single container is shared across
// parallel workers, each scenario tags its browser context with a unique header and queries
// only its own requests from WireMock's request journal.

import { BrowserContext } from "@playwright/test";
import { randomUUID } from "crypto";

const SCENARIO_HEADER = "x-e2e-scenario";

/** Control surface returned by mockComposer for use in test assertions. */
export type ComposerMock = {
    /**
     * Query params of every Composer content-create POST this scenario made,
     * in arrival order (most recent last).
     */
    contentRequests: () => Promise<URLSearchParams[]>;
};

// One WireMock logged request, as returned by GET/POST /__admin/requests.
type LoggedRequest = { request: { url: string } };

export async function mockComposer(
    context: BrowserContext,
    mockComposerApiUrl: string,
): Promise<ComposerMock> {
    const scenarioId = randomUUID();
    // Tag every request from this context so it can be told apart from other
    // scenarios sharing the same mock container.
    await context.setExtraHTTPHeaders({ [SCENARIO_HEADER]: scenarioId });

    return {
        contentRequests: async () => {
            const response = await fetch(
                `${mockComposerApiUrl}/__admin/requests/find`,
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        method: "POST",
                        urlPath: "/api/content",
                        headers: { [SCENARIO_HEADER]: { equalTo: scenarioId } },
                    }),
                },
            );
            if (!response.ok) {
                throw new Error(
                    `Composer mock journal query failed: ${response.status}`,
                );
            }
            const { requests } = (await response.json()) as {
                requests: LoggedRequest["request"][];
            };
            // WireMock returns newest-first; reverse so the caller's last entry
            // is the most recent request.
            return requests
                .map((r) => new URL(r.url, "http://composer.local").searchParams)
                .reverse();
        },
    };
}