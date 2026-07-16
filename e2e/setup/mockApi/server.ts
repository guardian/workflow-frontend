import { createServer, type ServerResponse } from "http";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * A small mock of the workflow datastore API used by the local Docker stack.
 * The real service is unreachable from the stack, so this stub serves static
 * fixtures for the datastore endpoints the app reads.
 *
 * Endpoints:
 *   - GET /api/sections/list                      -> section-list.json
 *   - GET /api/desks/list                         -> desk-list.json
 *   - GET /api/sectionDeskMapping/sectionsInDesk  -> section-desk-mapping.json
 *   - GET /api/stubs                              -> workflow-list.json
 *   - GET /__admin/health   readiness probe used by the container wait strategy
 */

const PORT = Number(process.env.PORT ?? 8080);

/**
 * The workflow datastore fixtures served from the `/api/*` endpoints, read once
 * at startup. Each fixture lives next to the server in the container image (see
 * `e2e/images/mock-datastore.Dockerfile`) but at the repo-relative path during
 * local dev, so try both locations.
 */
const scriptDir = dirname(fileURLToPath(import.meta.url));
function loadFixture(name: string): string {
    const candidates = [
        join(scriptDir, `fixtures/${name}`),
        join(scriptDir, `../../fixtures/datastore-responses/${name}`),
    ];
    for (const candidate of candidates) {
        try {
            return readFileSync(candidate, "utf8");
        } catch {
            // Try the next candidate.
        }
    }
    throw new Error(
        `[mock-workflow-datastore] Could not find ${name} in: ${candidates.join(", ")}`,
    );
}

/** Maps a datastore endpoint path to the fixture served verbatim from it. */
const fixtureByPath: Record<string, string> = {
    "/api/sections/list": loadFixture("section-list.json"),
    "/api/desks/list": loadFixture("desk-list.json"),
    "/api/sectionDeskMapping/sectionsInDesk": loadFixture(
        "section-desk-mapping.json",
    ),
    "/api/stubs": loadFixture("workflow-list.json"),
};

function sendJson(res: ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
    });
    res.end(payload);
}

function route(res: ServerResponse, method: string, pathname: string): void {
    // Readiness probe used by the container wait strategy.
    if (pathname === "/__admin/health" && method === "GET") {
        sendJson(res, 200, { status: "ok" });
        return;
    }

    // Serve the matching workflow datastore fixture verbatim.
    if (method === "GET" && fixtureByPath[pathname]) {
        const fixture = fixtureByPath[pathname];
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(fixture),
        });
        res.end(fixture);
        return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found", method, pathname }));
}

const server = createServer((req, res) => {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const pathname = url.pathname;
    console.log(`[mock-workflow-datastore] ${method} ${pathname}${url.search}`);
    route(res, method, pathname);
});

server.listen(PORT, () => {
    console.log(`[mock-workflow-datastore] listening on port ${PORT}`);
});
