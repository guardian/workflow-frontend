
// Composer is not reachable from the local stack, so intercept the cross-origin
// calls the stub modal makes to it: template loading on open and the content
// creation POST on submit. Returning a realistic Composer content document lets
// the modal go on to persist a real stub in Workflow (same-origin POST
// /api/stubs), which is what surfaces the new piece on the dashboard.

import { Page } from "@playwright/test";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

// Placeholder token standing in for the content id throughout the sample
// document. Every occurrence is swapped for a freshly generated id on each
// create so responses are unique.
const CONTENT_ID_PLACEHOLDER = "__CONTENT_ID__";

// Sample Composer content document returned from a successful create, read from
// disk. The id placeholder is substituted and the commissioned length /
// production office are overwritten from the incoming request before serving.
const COMPOSER_CONTENT_TEMPLATE = fs.readFileSync(
    path.join(__dirname, "composerContent.json"),
    "utf8",
);

// Generate a 24-character hex id in the same shape as a Mongo ObjectId.
function randomContentId(): string {
    return randomBytes(12).toString("hex");
}

// Build a fresh Composer content document: a unique id everywhere plus the
// commissioned length / production office taken from the incoming create
// request (falling back to the sample defaults when the param is absent).
function buildComposerContent(
    initialCommissionedLength: string | null,
    productionOffice: string | null,
): unknown {
    const id = randomContentId();
    const content = JSON.parse(
        COMPOSER_CONTENT_TEMPLATE.split(CONTENT_ID_PLACEHOLDER).join(id),
    );

    for (const stage of ["preview", "live"] as const) {
        const stageData = content?.data?.[stage]?.data;
        if (!stageData) {
            continue;
        }
        if (
            initialCommissionedLength !== null &&
            stageData.fields?.commissionedLength
        ) {
            stageData.fields.commissionedLength.data = initialCommissionedLength;
        }
        if (productionOffice !== null && stageData.settings?.productionOffice) {
            stageData.settings.productionOffice.data = productionOffice;
        }
    }

    return content;
}

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
            const params = new URL(request.url()).searchParams;
            const content = buildComposerContent(
                params.get("initialCommissionedLength"),
                params.get("productionOffice"),
            );
            await route.fulfill({
                status: 200,
                headers: { ...cors, "content-type": "application/json" },
                body: JSON.stringify(content),
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