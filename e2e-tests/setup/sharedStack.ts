import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { E2E_ROOT } from "./constants.js";
import type { StackConnection } from "./types.js";

/** Written by dev:local; read by test runs to reuse a long-running stack. */
export const SHARED_STACK_FILE = resolve(E2E_ROOT, ".shared-stack.json");
/** Written by global-setup for the current run; read by per-test fixtures. */
export const ACTIVE_STACK_FILE = resolve(E2E_ROOT, ".active-stack.json");

export function writeSharedStackInfo(info: StackConnection): void {
  writeFileSync(SHARED_STACK_FILE, JSON.stringify(info, null, 2));
}

export function readSharedStackInfo(): StackConnection | undefined {
  if (!existsSync(SHARED_STACK_FILE)) return undefined;
  return JSON.parse(readFileSync(SHARED_STACK_FILE, "utf-8")) as StackConnection;
}

export function clearSharedStackInfo(): void {
  rmSync(SHARED_STACK_FILE, { force: true });
}

export function writeActiveStackInfo(info: StackConnection): void {
  writeFileSync(ACTIVE_STACK_FILE, JSON.stringify(info, null, 2));
}

export function readActiveStackInfo(): StackConnection {
  if (!existsSync(ACTIVE_STACK_FILE)) {
    throw new Error(
      "No active stack found. Run `yarn dev:local` first (or use `yarn test:ci`).",
    );
  }
  return JSON.parse(readFileSync(ACTIVE_STACK_FILE, "utf-8")) as StackConnection;
}

export function clearActiveStackInfo(): void {
  rmSync(ACTIVE_STACK_FILE, { force: true });
}
