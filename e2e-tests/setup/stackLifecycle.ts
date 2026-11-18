interface StackReporter {
    step<Result>(name: string, run: () => Promise<Result>): Promise<Result>;
}

interface Stoppable {
    stop(): Promise<unknown>;
}

export async function settleAll<Results extends unknown[]>(
    actions: { [Index in keyof Results]: () => Promise<Results[Index]> },
): Promise<Results> {
    const pending = actions.map(async (action) => action());

    try {
        return await Promise.all(pending) as Results;
    } catch (error) {
        await Promise.allSettled(pending);
        throw error;
    }
}

/**
 * Callers must settle every startup stage before cleanup and start no more
 * resources afterwards. Use settleAll for parallel stages, including when a
 * termination signal interrupts startup.
 */
export function createStackResources(reporter: StackReporter) {
    const containers = new Map<string, Stoppable>();
    let network: Stoppable | undefined;
    let cleanup: Promise<number> | undefined;

    async function startNetwork<Resource extends Stoppable>(
        start: () => Promise<Resource>,
    ): Promise<Resource> {
        return reporter.step("create:network", async () => {
            const startedNetwork = await start();
            network = startedNetwork;
            return startedNetwork;
        });
    }

    async function startContainer<Resource extends Stoppable>(
        name: string,
        start: () => Promise<Resource>,
    ): Promise<Resource> {
        return reporter.step(`start:${name}`, async () => {
            const container = await start();
            containers.set(name, container);
            return container;
        });
    }

    function stopAll(): Promise<number> {
        return cleanup ??= stopOwnedResources();
    }

    async function stopOwnedResources(): Promise<number> {
        const results = await Promise.allSettled(
            [...containers].map(async ([name, container]) =>
                reporter.step(`stop:${name}`, () => container.stop()),
            ),
        );

        if (network) {
            results.push(...await Promise.allSettled([
                (async () => reporter.step("remove:network", () => network!.stop()))(),
            ]));
        }

        return results.filter((result) => result.status === "rejected").length;
    }

    return { startNetwork, startContainer, stopAll };
}
