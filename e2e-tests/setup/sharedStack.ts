import fs from "fs";
import path from "path";

/**
 * Helpers for sharing a long-running local stack (started via `npm run
 * local:stack`) with the e2e tests.
 *
 * When `local:stack` boots, it writes the running stack's connection details to
 * a gitignored metadata file. The e2e fixture can then reuse that stack instead
 * of building images and booting fresh containers on every run, which makes the
 * inner dev loop much faster while iterating on tests.
 */

export type SharedStackInfo = {
    baseUrl: string;
    panDomainPrivateKey: string;
    mockApiUrl: string;
    mockComposerApiUrl: string;
    mockTelemetryApiUrl: string;
};

const SHARED_STACK_FILE = "target/tmp/e2e-local-stack.json";

function sharedStackFilePath(e2eRoot: string): string {
    return path.join(e2eRoot, SHARED_STACK_FILE);
}

export function writeSharedStackInfo(
    e2eRoot: string,
    info: SharedStackInfo,
): void {
    const filePath = sharedStackFilePath(e2eRoot);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(info, null, 2), "utf8");
}

export function clearSharedStackInfo(e2eRoot: string): void {
    const filePath = sharedStackFilePath(e2eRoot);
    fs.rmSync(filePath, { force: true });
}

export function readSharedStackInfo(
    e2eRoot: string,
): SharedStackInfo | undefined {
    const filePath = sharedStackFilePath(e2eRoot);
    if (!fs.existsSync(filePath)) {
        return undefined;
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (
            parsed &&
            typeof parsed.baseUrl === "string" &&
            typeof parsed.panDomainPrivateKey === "string" &&
            typeof parsed.mockApiUrl === "string" &&
            typeof parsed.mockComposerApiUrl === "string" &&
            typeof parsed.mockTelemetryApiUrl === "string"
        ) {
            return parsed as SharedStackInfo;
        }
    } catch {
        // Fall through and treat a corrupt/unreadable file as "no shared stack".
    }

    return undefined;
}
