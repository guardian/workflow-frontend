import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const OWNER_READ_WRITE = 0o600;
const OWNER_READ_WRITE_EXECUTE = 0o700;
const HEALTHCHECK_ATTEMPTS = 3;
const HEALTHCHECK_TIMEOUT_MS = 2_000;

export type SharedStackInfo = {
    baseUrl: string;
    panDomainPrivateKey: string;
    mockApiUrl: string;
    mockComposerApiUrl: string;
    mockTelemetryApiUrl: string;
    runId?: string;
};

const SHARED_STACK_FILE = "target/tmp/e2e-local-stack.json";

export function writeSharedStackInfo(
    e2eRoot: string,
    info: SharedStackInfo & { runId: string },
): void {
    const filePath = path.join(e2eRoot, SHARED_STACK_FILE);
    fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: OWNER_READ_WRITE_EXECUTE });
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

    try {
        fs.writeFileSync(temporaryPath, JSON.stringify(info, null, 2), {
            encoding: "utf8",
            mode: OWNER_READ_WRITE,
            flag: "wx",
        });
        fs.renameSync(temporaryPath, filePath);
    } finally {
        fs.rmSync(temporaryPath, { force: true });
    }
}

export function clearSharedStackInfo(e2eRoot: string, runId: string): void {
    if (readSharedStackInfo(e2eRoot)?.runId === runId) {
        fs.rmSync(path.join(e2eRoot, SHARED_STACK_FILE), { force: true });
    }
}

export function readSharedStackInfo(e2eRoot: string): SharedStackInfo | undefined {
    try {
        const parsed = JSON.parse(fs.readFileSync(path.join(e2eRoot, SHARED_STACK_FILE), "utf8"));
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
        return undefined;
    }

    return undefined;
}

type SharedStackStatus = "healthy" | "unavailable" | "missing";

function isConnectionRefused(error: unknown): boolean {
    if (typeof error !== "object" || error === null) {
        return false;
    }

    if (error instanceof AggregateError) {
        return error.errors.length > 0 && error.errors.every(isConnectionRefused);
    }

    if ("code" in error) {
        return error.code === "ECONNREFUSED";
    }

    return "cause" in error && isConnectionRefused(error.cause);
}

export async function checkSharedStack(baseUrl: string): Promise<SharedStackStatus> {
    let allConnectionsRefused = true;

    for (let attempt = 0; attempt < HEALTHCHECK_ATTEMPTS; attempt++) {
        try {
            const response = await fetch(new URL("/management/healthcheck", baseUrl), {
                redirect: "manual",
                signal: AbortSignal.timeout(HEALTHCHECK_TIMEOUT_MS),
            });
            allConnectionsRefused = false;
            await response.body?.cancel().catch(() => { });
            if (response.status === 200) {
                return "healthy";
            }
        } catch (error) {
            if (!isConnectionRefused(error)) {
                allConnectionsRefused = false;
            }
        }
    }
    // A compiling or unhealthy shared stack may still own the fixed host ports.
    // Only repeated connection refusals justify trying to start another stack.
    return allConnectionsRefused ? "missing" : "unavailable";
}
