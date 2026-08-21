import { spawn, type ChildProcess } from "child_process";
import path from "path";

const FRONTEND_PORT = 9090;
const HEALTHCHECK_URL = `http://localhost:${FRONTEND_PORT}/management/healthcheck`;

// Reused as the sbt launcher: it configures the AWS (MinIO) profiles, SBT_OPTS
// and LOCAL_E2E_TEST, then runs the Play app in dev (watch) mode against the
// e2e config. Same script the containerised path uses, so there is one source
// of truth for how the app boots.
const SBT_LAUNCHER = "e2e-tests/images/start-workflow-frontend";

export type FrontendProcess = {
    sbt: ChildProcess;
    webpack: ChildProcess;
};

export type StartFrontendOptions = {
    /** Repository root; sbt/webpack and the e2e config path are relative to it. */
    repoRoot: string;
    /** Extra environment for the child processes (AWS endpoints, credentials). */
    env: NodeJS.ProcessEnv;
    streamLogs?: boolean;
    startupTimeoutMs?: number;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHealthcheck(
    timeoutMs: number,
    sbt: ChildProcess,
): Promise<void> {
    let exitCode: number | null = null;
    let exited = false;
    sbt.once("exit", (code) => {
        exited = true;
        exitCode = code;
    });

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (exited) {
            throw new Error(
                `Frontend sbt process exited (code ${exitCode}) before becoming healthy`,
            );
        }
        try {
            const response = await fetch(HEALTHCHECK_URL);
            if (response.ok) {
                return;
            }
        } catch {
            // Not accepting connections yet; keep polling.
        }
        await delay(2000);
    }
    throw new Error(
        `Frontend did not pass ${HEALTHCHECK_URL} within ${timeoutMs}ms`,
    );
}

/**
 * Start the Play frontend directly on the host in watch mode: `yarn build-dev`
 * (webpack watch) for assets and sbt dev-mode for the app. Resolves once the
 * app answers its healthcheck; rejects (after cleanup) if sbt exits or times out.
 */
export async function startFrontend({
    repoRoot,
    env,
    streamLogs = false,
    startupTimeoutMs = 10 * 60 * 1000,
}: StartFrontendOptions): Promise<FrontendProcess> {
    const childEnv = { ...process.env, ...env };
    const out = streamLogs ? "inherit" : "ignore";

    const webpack = spawn("yarn", ["build-dev"], {
        cwd: repoRoot,
        env: childEnv,
        // detached so it leads its own process group and can be killed as a tree.
        detached: true,
        stdio: ["ignore", out, out],
    });

    // Keep sbt's stdin open (a pipe we never close): Play dev-mode `run` stops on
    // stdin EOF, so an /dev/null stdin would make it exit immediately.
    const sbt = spawn("bash", [path.join(repoRoot, SBT_LAUNCHER)], {
        cwd: repoRoot,
        env: childEnv,
        detached: true,
        stdio: ["pipe", out, out],
    });

    const frontend: FrontendProcess = { sbt, webpack };
    try {
        await waitForHealthcheck(startupTimeoutMs, sbt);
    } catch (error) {
        await stopFrontend(frontend);
        throw error;
    }
    return frontend;
}

function killTree(child: ChildProcess | undefined, signal: NodeJS.Signals): void {
    if (!child || child.pid === undefined || child.killed) {
        return;
    }
    try {
        // Negative pid targets the whole process group (see `detached: true`).
        process.kill(-child.pid, signal);
    } catch {
        // Already gone.
    }
}

export async function stopFrontend(frontend?: FrontendProcess): Promise<void> {
    if (!frontend) {
        return;
    }
    killTree(frontend.sbt, "SIGTERM");
    killTree(frontend.webpack, "SIGTERM");
    await delay(5000);
    killTree(frontend.sbt, "SIGKILL");
    killTree(frontend.webpack, "SIGKILL");
}
