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
};

const SHARED_STACK_FILE = "tmp/e2e-local-stack.json";

function sharedStackFilePath(projectRoot: string): string {
    return path.join(projectRoot, SHARED_STACK_FILE);
}

export function writeSharedStackInfo(
    projectRoot: string,
    info: SharedStackInfo,
): void {
    const filePath = sharedStackFilePath(projectRoot);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(info, null, 2), "utf8");
}

export function clearSharedStackInfo(projectRoot: string): void {
    const filePath = sharedStackFilePath(projectRoot);
    fs.rmSync(filePath, { force: true });
}

export function readSharedStackInfo(
    projectRoot: string,
): SharedStackInfo | undefined {
    const filePath = sharedStackFilePath(projectRoot);
    if (!fs.existsSync(filePath)) {
        return undefined;
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (
            parsed &&
            typeof parsed.baseUrl === "string" &&
            typeof parsed.panDomainPrivateKey === "string" &&
            typeof parsed.mockApiUrl === "string"
        ) {
            return parsed as SharedStackInfo;
        }
    } catch {
        // Fall through and treat a corrupt/unreadable file as "no shared stack".
    }

    return undefined;
}

/**
 * Returns true if the given base URL responds to an HTTP request. Any HTTP
 * status (including 401/403 from auth) counts as reachable — we only care that
 * the stack is up and accepting connections.
 */
export async function isStackReachable(
    baseUrl: string,
    timeoutMs = 3000,
): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        await fetch(baseUrl, {
            method: "GET",
            redirect: "manual",
            signal: controller.signal,
        });
        return true;
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
}
