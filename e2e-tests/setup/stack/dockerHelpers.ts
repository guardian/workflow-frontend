import { spawn } from "node:child_process";
import path from "node:path";
import {
    GenericContainer,
    getContainerRuntimeClient,
    getReaper,
    LABEL_TESTCONTAINERS_SESSION_ID,
} from "testcontainers";
import type { StackDiagnostics } from "../stackDiagnostics";

interface BuildImageOptions {
    context: string;
    dockerfile: string;
    tag: string;
    name: string;
    diagnostics: StackDiagnostics;
}

export async function buildImage({
    context,
    dockerfile,
    tag,
    name,
    diagnostics,
}: BuildImageOptions): Promise<GenericContainer> {
    const reaper = await getReaper(await getContainerRuntimeClient());
    const logPath = path.join(diagnostics.directory, "builds", `${name}.log`);

    await new Promise<void>((resolve, reject) => {
        const child = spawn("docker", [
            "build",
            "--progress=plain",
            "--label", `${LABEL_TESTCONTAINERS_SESSION_ID}=${reaper.sessionId}`,
            "--file", dockerfile,
            "--tag", tag,
            ".",
        ], {
            cwd: context,
            env: { ...process.env, DOCKER_BUILDKIT: "1" },
            stdio: ["ignore", "pipe", "pipe"],
            timeout: 20 * 60 * 1000,
            killSignal: "SIGKILL",
        });

        diagnostics.capture("builds", name, child.stdout);
        diagnostics.capture("builds", name, child.stderr);

        child.once("error", (cause) => {
            reject(new Error(`Could not build ${name}; see ${logPath}`, { cause }));
        });
        child.once("close", (code, signal) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Build ${name} exited with ${signal ?? code}; see ${logPath}`));
            }
        });
    });

    return new GenericContainer(tag);
}
