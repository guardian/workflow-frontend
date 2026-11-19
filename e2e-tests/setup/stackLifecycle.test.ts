import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { createStackResources, settleAll } from "./stackLifecycle";

function deferred<Value>() {
    let resolve!: (value: Value) => void;
    const promise = new Promise<Value>((resolvePromise) => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
}

function createReporter() {
    return {
        step<Result>(_name: string, run: () => Promise<Result>): Promise<Result> {
            return run();
        },
    };
}

test("waits for pending containers before cleanup and preserves the original startup error", async () => {
    const stopped: string[] = [];
    const resources = createStackResources(createReporter());
    const late = deferred<{ stop(): Promise<void> }>();

    await resources.startNetwork(async () => ({
        async stop() { stopped.push("network"); },
    }));

    const failure = new Error("Image build failed");
    const startup = settleAll([
        () => { throw failure; },
        () => resources.startContainer("late", () => late.promise),
    ]).catch(async (error) => {
        await resources.stopAll();
        return error;
    });

    await setImmediate();

    assert.equal(stopped.length, 0);

    late.resolve({ async stop() { stopped.push("late"); } });
    assert.equal(await startup, failure);
    assert.deepEqual(stopped, ["late", "network"]);
});

test("attempts all container stops in parallel and removes the network last, even if a stop fails", async () => {
    const events: string[] = [];
    const slowStop = deferred<void>();
    const resources = createStackResources(createReporter());

    await resources.startNetwork(async () => ({
        async stop() {
            events.push("network");
            throw new Error("Network is still attached");
        },
    }));
    await resources.startContainer("broken", async () => ({
        stop() {
            events.push("broken");
            throw new Error("Stop failed");
        },
    }));
    await resources.startContainer("slow", async () => ({
        async stop() {
            events.push("slow");
            await slowStop.promise;
        },
    }));

    const cleanup = resources.stopAll();

    assert.deepEqual([...events].sort(), ["broken", "slow"]);

    slowStop.resolve();

    assert.equal(await cleanup, 2);
    assert.equal(await resources.stopAll(), 2);

    assert.equal(events.at(-1), "network");
    assert.equal(events.length, 3);
});
