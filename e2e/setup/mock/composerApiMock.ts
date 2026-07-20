
// Composer is not reachable from the local stack, so intercept the cross-origin
// calls the stub modal makes to it: template loading on open and the content
// creation POST on submit. Returning a valid Composer id lets the modal go on
// to persist a real stub in Workflow (same-origin POST /api/stubs), which is

import { Page } from "@playwright/test";

// what surfaces the new piece on the dashboard.
export async function mockComposer(page: Page): Promise<void> {
    await page.route(/^https:\/\/composer\.[^/]+\/api\//, async (route) => {
        const request = route.request();
        const cors: Record<string, string> = {
            "access-control-allow-origin": request.headers()["origin"] ?? "*",
            "access-control-allow-credentials": "true",
            "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
            "access-control-allow-headers":
                request.headers()["access-control-request-headers"] ?? "content-type",
        };
        if (request.method() === "OPTIONS") {
            await route.fulfill({ status: 204, headers: cors });
            return;
        }
        if (
            request.method() === "POST" &&
            /\/api\/content(\?|$)/.test(request.url())
        ) {
            await route.fulfill({
                status: 200,
                headers: { ...cors, "content-type": "application/json" },
                body: JSON.stringify({
                    data: { id: `e2e-composer-${Date.now()}`, type: "gallery" },
                }),
            });
            return;
        }
        // Template loading and any other Composer GET: return an empty list.
        await route.fulfill({
            status: 200,
            headers: { ...cors, "content-type": "application/json" },
            body: "[]",
        });
    });
}