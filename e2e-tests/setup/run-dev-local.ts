import { once } from "node:events";
import { constants } from "node:os";
import { startLocalStack, type LocalStack } from "./stackContainers";
import { createStackDiagnostics } from "./stackDiagnostics";

async function main(): Promise<void> {
    const e2eRoot = process.cwd();
    const diagnostics = createStackDiagnostics(e2eRoot);
    const shutdown = new AbortController();
    let stack: LocalStack | undefined;
    const terminated = once(shutdown.signal, "abort");
    const signals = ["SIGINT", "SIGTERM", "SIGHUP"] as const;

    function onSignal(signal: NodeJS.Signals): void {
        if (shutdown.signal.aborted) return;
        process.exitCode = 128 + constants.signals[signal];
        shutdown.abort(new Error(`Stack interrupted by ${signal}`));
    }

    for (const signal of signals) process.on(signal, onSignal);

    try {
        stack = await startLocalStack(e2eRoot, {
            exposeHostAuth: true,
            signal: shutdown.signal,
            diagnostics,
        });
        shutdown.signal.throwIfAborted();
        if (stack.authUrl) {
            console.log(`\nTo authenticate a browser on your host, open: ${stack.authUrl}\nIt sets the auth cookie and redirects to the app.`);
        }
        console.log("Press Ctrl+C to stop.");
        process.stdin.resume();
        await terminated;
    } catch (error) {
        diagnostics.error("local:stack", error);
        process.exitCode ||= 1;
    } finally {
        process.stdin.pause();
        for (const signal of signals) process.off(signal, onSignal);
        try {
            await stack?.stop();
        } catch (error) {
            diagnostics.error("cleanup:stack", error);
        }
    }
}

main().catch((error: unknown) => {
    // Configuration errors happen before a diagnostics logger is available.
    console.error(error);
    process.exitCode ||= 1;
});
