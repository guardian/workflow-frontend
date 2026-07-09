import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * A small, configurable mock of the flexible-content (Composer) API used by the
 * restorer when it talks to a stack. The real service is unreachable from the
 * local Docker stack, so this stub stands in for it and lets the restore modal
 * render realistic destination state and exercise the restore call end-to-end.
 *
 * It serves the two endpoints the restorer uses (see `app/logic/FlexibleApi.scala`):
 *   - GET  /content/:contentId/changeDetails   (destination availability)
 *   - PUT  /restorer/content/:contentId        (restore into existing content)
 *   - PUT  /restorer/contentRaw/:contentId     (restore as new content)
 *
 * The responses are runtime-configurable via the `/__admin` endpoints so a test
 * (or a developer poking the running stack) can change what each call returns:
 *   - GET  /__admin/state    read the current mock state
 *   - POST /__admin/state    deep-merge a partial state into the current state
 *   - POST /__admin/reset    reset back to the defaults
 *   - GET  /__admin/health   readiness probe used by the container wait strategy
 *
 * Every request/response is also logged to the console and captured in memory so
 * tests can assert on what was sent and received:
 *   - GET    /__admin/requests   read the captured request/response log
 *   - DELETE /__admin/requests   clear the captured log (leaves state untouched)
 */

type ChangeDetailsState = {
    /** HTTP status to return. 200 makes the destination "available". */
    status: number;
    /**
     * The content's current revision on this stack, or null to simulate a 200
     * response with no change details (rendered as "content not on this
     * instance" in the modal).
     */
    revision: number | null;
    /** Last-modified time in epoch milliseconds, or null (see `revision`). */
    lastModified: number | null;
    /**
     * When true, simulate a stack that cannot be reached by abruptly closing the
     * connection. The restorer's HTTP call then fails fast and the destination
     * is marked unavailable (rendered as a disabled "cannot be used" option in
     * the modal). This avoids the multi-second timeout a hung response would
     * cause, which would block the app's request threads (`restoreDestinations`
     * awaits each stack sequentially) and destabilise concurrent test runs.
     */
    unreachable?: boolean;
    /**
     * Simulate only *specific* stacks being unreachable while the rest respond
     * normally. Each stack reaches this mock under its own hostname (registered
     * as a network alias — see `tests/e2e/stackContainers.ts`), so a request
     * whose `Host` header contains any of these substrings has its connection
     * abruptly closed (as `unreachable` does), while other stacks still get the
     * configured response. This models "a single destination stack cannot be
     * reached" (one destination unavailable, the others still available).
     */
    unreachableHosts?: string[];
};

type RestoreState = {
    /** HTTP status to return for the restore PUTs. 204 means success. */
    status: number;
    /** Optional response body (used for non-204 error responses). */
    body: string;
};

type MockState = {
    changeDetails: ChangeDetailsState;
    /**
     * Per-content-id overrides for `changeDetails`. When an incoming request's
     * contentId is present here, this entry is used instead of the default
     * `changeDetails`, letting different pieces of content model different
     * destination states in the same run.
     */
    changeDetailsByContentId: Record<string, ChangeDetailsState>;
    restore: RestoreState;
};

const PORT = Number(process.env.PORT ?? 8080);

/**
 * The workflow content list served from `GET /api/content`, read once at
 * startup from the shared fixture. The fixture lives next to the server in the
 * container image (see `e2e/images/mock-flexible-api.Dockerfile`) but at the
 * repo-relative path during local dev, so try both locations.
 */
const scriptDir = dirname(fileURLToPath(import.meta.url));
const workflowListJson = (() => {
    const candidates = [
        join(scriptDir, "fixtures/workflow-list.json"),
        join(scriptDir, "../../fixtures/responses/workflow-list.json"),
    ];
    for (const candidate of candidates) {
        try {
            return readFileSync(candidate, "utf8");
        } catch {
            // Try the next candidate.
        }
    }
    throw new Error(
        `[mock-flexible-api] Could not find workflow-list.json in: ${candidates.join(", ")}`,
    );
})();

function defaultState(): MockState {
    return {
        changeDetails: {
            status: 200,
            // Defaults mirror the snapshot fixture so the modal shows realistic
            // "currently has revision 10, last modified at ..." text.
            revision: 10,
            lastModified: 1781234474425,
        },
        changeDetailsByContentId: {},
        restore: {
            status: 204,
            body: "",
        },
    };
}

function loadInitialState(): MockState {
    const base = defaultState();
    const raw = process.env.MOCK_INITIAL_STATE;
    if (!raw) {
        return base;
    }
    try {
        return mergeState(base, JSON.parse(raw));
    } catch (error) {
        console.warn(
            `[mock-flexible-api] Ignoring invalid MOCK_INITIAL_STATE: ${String(error)}`,
        );
        return base;
    }
}

/** Deep-merge a partial state object onto the current state. */
function mergeState(current: MockState, partial: unknown): MockState {
    if (typeof partial !== "object" || partial === null) {
        return current;
    }
    const next: MockState = {
        changeDetails: { ...current.changeDetails },
        changeDetailsByContentId: { ...current.changeDetailsByContentId },
        restore: { ...current.restore },
    };
    const incoming = partial as Partial<{
        changeDetails: Partial<ChangeDetailsState>;
        changeDetailsByContentId: Record<string, Partial<ChangeDetailsState>>;
        restore: Partial<RestoreState>;
    }>;
    if (incoming.changeDetails) {
        next.changeDetails = { ...next.changeDetails, ...incoming.changeDetails };
    }
    if (incoming.changeDetailsByContentId) {
        for (const [contentId, override] of Object.entries(
            incoming.changeDetailsByContentId,
        )) {
            next.changeDetailsByContentId[contentId] = {
                // Fall back to the default changeDetails for any fields the
                // override does not set, so a partial per-content override still
                // produces a complete response.
                ...(next.changeDetailsByContentId[contentId] ?? next.changeDetails),
                ...override,
            };
        }
    }
    if (incoming.restore) {
        next.restore = { ...next.restore, ...incoming.restore };
    }
    return next;
}

let state = loadInitialState();

/**
 * A single captured request/response pair. Tests can read these back via
 * `GET /__admin/requests` to assert on what the restorer sent to (and received
 * from) the mock flexible-content API.
 */
type LoggedExchange = {
    /** ISO timestamp of when the request was received. */
    time: string;
    method: string;
    /** Path without the query string, e.g. `/content/abc/changeDetails`. */
    path: string;
    /** Query string including the leading `?`, or an empty string. */
    query: string;
    requestHeaders: Record<string, string | string[] | undefined>;
    requestBody: string;
    responseStatus: number;
    responseBody: string;
};

/** In-memory log of every exchange, in the order they were received. */
const requestLog: LoggedExchange[] = [];

/**
 * Wrap a response so its final status code and body are captured, then invoke
 * `onFinish` once the response has been fully written. The original methods are
 * still called, so behaviour is unchanged.
 */
function captureResponse(
    res: ServerResponse,
    onFinish: (status: number, body: string) => void,
): void {
    let status = 200;
    const chunks: Buffer[] = [];
    const origWriteHead = res.writeHead.bind(res);
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    const collect = (chunk: unknown): void => {
        if (chunk && typeof chunk !== "function") {
            chunks.push(Buffer.from(chunk as string | Buffer));
        }
    };

    res.writeHead = function (this: ServerResponse, code: number, ...args: unknown[]) {
        status = code;
        return (origWriteHead as (...a: unknown[]) => ServerResponse)(code, ...args);
    } as typeof res.writeHead;

    res.write = function (this: ServerResponse, chunk: unknown, ...args: unknown[]) {
        collect(chunk);
        return (origWrite as (...a: unknown[]) => boolean)(chunk, ...args);
    } as typeof res.write;

    res.end = function (this: ServerResponse, chunk?: unknown, ...args: unknown[]) {
        collect(chunk);
        onFinish(status, Buffer.concat(chunks).toString("utf8"));
        return (origEnd as (...a: unknown[]) => ServerResponse)(chunk, ...args);
    } as typeof res.end;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
    });
    res.end(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

function handleChangeDetails(
    res: ServerResponse,
    contentId: string,
    host: string,
): void {
    // Use the per-content override when one is configured, otherwise fall back to
    // the shared default.
    const cd = state.changeDetailsByContentId[contentId] ?? state.changeDetails;
    const hostUnreachable =
        cd.unreachableHosts?.some((fragment) => host.includes(fragment)) ?? false;
    if (cd.unreachable || hostUnreachable) {
        // Simulate a stack that cannot be reached: abruptly destroy the socket so
        // the restorer's HTTP call fails fast and marks the destination
        // unavailable, without the multi-second timeout that would otherwise
        // block the app's request threads. `unreachableHosts` targets only the
        // stacks whose hostname matches, leaving the others reachable.
        res.socket?.destroy();
        return;
    }
    const { status, revision, lastModified } = cd;
    if (status !== 200) {
        res.writeHead(status);
        res.end();
        return;
    }
    // The restorer reads `data.revision` and `data.lastModified.date`; only
    // include them when both are present, otherwise return an empty `data`
    // object to simulate "available but no content on this instance".
    const data =
        revision !== null && lastModified !== null
            ? { revision, lastModified: { date: lastModified } }
            : {};
    sendJson(res, 200, { data });
}

function handleRestore(res: ServerResponse): void {
    const { status, body } = state.restore;
    if (status === 204 || body === "") {
        res.writeHead(status);
        res.end();
        return;
    }
    res.writeHead(status, { "Content-Type": "text/plain" });
    res.end(body);
}

function route(
    req: IncomingMessage,
    res: ServerResponse,
    method: string,
    url: URL,
    pathname: string,
    requestBody: string,
): void {
    // --- Admin / configuration endpoints --------------------------------------
    if (pathname === "/api/content" && method === "GET") {
        // Serve the workflow content list fixture verbatim.
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(workflowListJson),
        });
        res.end(workflowListJson);
        return;
    }

    if (pathname === "/__admin/health" && method === "GET") {
        sendJson(res, 200, { status: "ok" });
        return;
    }

    if (pathname === "/__admin/state" && method === "GET") {
        sendJson(res, 200, state);
        return;
    }

    if (pathname === "/__admin/state" && method === "POST") {
        try {
            state = mergeState(state, requestBody ? JSON.parse(requestBody) : {});
            sendJson(res, 200, state);
        } catch (error) {
            sendJson(res, 400, { error: String(error) });
        }
        return;
    }

    if (pathname === "/__admin/reset" && method === "POST") {
        state = defaultState();
        sendJson(res, 200, state);
        return;
    }

    // Read the captured request/response log so tests can assert on it.
    if (pathname === "/__admin/requests" && method === "GET") {
        sendJson(res, 200, requestLog);
        return;
    }

    // Clear the captured request/response log without touching the mock state.
    if (pathname === "/__admin/requests" && method === "DELETE") {
        requestLog.length = 0;
        sendJson(res, 200, requestLog);
        return;
    }

    // --- Mocked flexible-content API ------------------------------------------
    const changeDetailsMatch = pathname.match(
        /^\/content\/([^/]+)\/changeDetails$/,
    );
    if (method === "GET" && changeDetailsMatch) {
        handleChangeDetails(
            res,
            decodeURIComponent(changeDetailsMatch[1]),
            req.headers.host ?? "",
        );
        return;
    }

    if (
        method === "PUT" &&
        /^\/restorer\/(content|contentRaw)\/[^/]+$/.test(pathname)
    ) {
        handleRestore(res);
        return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found", method, pathname }));
}

const server = createServer((req, res) => {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const pathname = url.pathname;

    readBody(req)
        .then((requestBody) => {
            captureResponse(res, (responseStatus, responseBody) => {
                requestLog.push({
                    time: new Date().toISOString(),
                    method,
                    path: pathname,
                    query: url.search,
                    requestHeaders: req.headers,
                    requestBody,
                    responseStatus,
                    responseBody,
                });
                console.log(
                    `[mock-flexible-api] ${method} ${pathname}${url.search} -> ${responseStatus}`,
                    {
                        requestBody: requestBody || undefined,
                        responseBody: responseBody || undefined,
                    },
                );
            });
            route(req, res, method, url, pathname, requestBody);
        })
        .catch((error: unknown) => {
            sendJson(res, 500, { error: String(error) });
        });
});

server.listen(PORT, () => {
    console.log(`[mock-flexible-api] listening on port ${PORT}`);
});
