import { startLocalStack } from "./setup/stackContainers";
import { createStackDiagnostics } from "./setup/stackDiagnostics";
import { checkSharedStack, readSharedStackInfo } from "./setup/sharedStack";

export async function prepareTestStack(
    e2eRoot: string,
    startStack = startLocalStack,
): Promise<(() => Promise<void>) | undefined> {
    const diagnostics = createStackDiagnostics(e2eRoot);

    try {
        const shared = readSharedStackInfo(e2eRoot);
        if (shared) {
            const status = await diagnostics.step("check:shared-stack", () =>
                checkSharedStack(shared.baseUrl),
            );
            if (status === "healthy") {
                diagnostics.log(`Reusing healthy shared stack at ${shared.baseUrl}; it will be left running`);
                return;
            }
            if (status !== "missing") {
                throw new Error(
                    `Shared stack at ${shared.baseUrl} is not healthy and may still hold its ports. ` +
                    "Wait for recompilation or restart it from its dev:local terminal, then retry.",
                );
            }
            diagnostics.log(
                "Shared frontend is no longer listening; starting a new stack. " +
                "If ports are still in use, stop the old dev:local process and retry.",
            );
        }

        const stack = await startStack(e2eRoot, { diagnostics });
        return () => stack.stop();
    } catch (error) {
        diagnostics.error("setup:stack", error);
        throw error;
    }
}

export default async function globalSetup() {
    return prepareTestStack(__dirname);
}
