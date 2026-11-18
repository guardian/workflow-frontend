import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { test, type TestContext } from "node:test";
import { createStackDiagnostics } from "./stackDiagnostics";

function temporaryE2eRoot(context: TestContext) {
    context.mock.method(console, "log", () => { });
    const e2eRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-diagnostics-test-"));
    context.after(() => fs.rmSync(e2eRoot, { recursive: true, force: true }));
    return e2eRoot;
}

test("redacts secrets split across log chunks or multiple lines", (context) => {
    const diagnostics = createStackDiagnostics(temporaryE2eRoot(context), { runId: "test-run", debug: false });
    const stream = new PassThrough();

    context.after(() => stream.destroy());
    diagnostics.addSecrets(["test-secret", "private-key-line\nother-key-line"]);
    diagnostics.capture("containers", "app", stream);

    stream.write("build failed: token=test-");
    stream.write("secret\nSet-Cookie: gutoolsAuth-assym=secret-cookie; Path=/\n");
    stream.write("private-key-line\nother-key-line\n");
    diagnostics.flush();

    const saved = fs.readFileSync(path.join(diagnostics.directory, "containers/app.log"), "utf8");

    assert.match(saved, /build failed: token=\[REDACTED\]/);
    assert.doesNotMatch(saved, /test-secret|secret-cookie|private-key-line|other-key-line/);
});

test("preserves the startup error when logs cannot be written", async (context) => {
    const e2eRoot = temporaryE2eRoot(context);

    fs.writeFileSync(path.join(e2eRoot, "logs"), "A file occupies the intended log directory");
    context.mock.method(console, "error", () => { });

    const diagnostics = createStackDiagnostics(e2eRoot, { runId: "test-run" });
    const failure = new Error("Readiness failed");

    await assert.rejects(
        diagnostics.step("startup", async () => { throw failure; }),
        (error) => error === failure,
    );
});
