import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { prepareTestStack } from "../global-setup";
import { readSharedStackInfo, writeSharedStackInfo } from "./sharedStack";

const connection = {
    baseUrl: "http://localhost:9091",
    panDomainPrivateKey: "test-key",
    mockApiUrl: "http://localhost:9080",
    mockComposerApiUrl: "http://localhost:9081",
    mockTelemetryApiUrl: "http://localhost:3132",
};

for (const failure of ["HTTP 503 followed by connection refusals", "timeouts"] as const) {
    test(`refuses to start another stack after ${failure}`, async (context) => {
        context.mock.method(console, "log", () => { });
        context.mock.method(console, "error", () => { });
        const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-stack-test-"));
        context.after(() => fs.rmSync(root, { recursive: true, force: true }));
        const shared = { ...connection, runId: "shared", ownerId: "shared-owner" };
        writeSharedStackInfo(root, shared);

        let responded = false;
        context.mock.method(globalThis, "fetch", async () => {
            if (failure === "timeouts") {
                throw new DOMException("Health check timed out", "TimeoutError");
            }
            if (!responded) {
                responded = true;
                return new Response(null, { status: 503 });
            }
            throw new TypeError("fetch failed", {
                cause: Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }),
            });
        });

        let started = false;
        await assert.rejects(prepareTestStack(root, async () => {
            started = true;
            return { ...connection, async stop() {} };
        }));

        assert.equal(started, false);
        assert.deepEqual(readSharedStackInfo(root), shared);
    });
}
