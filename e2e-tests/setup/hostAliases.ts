import { execFileSync } from "child_process";
import fs from "fs";

// Marker lines delimiting the block this module manages in /etc/hosts, so it can
// be rewritten/removed without touching anything else in the file.
const BEGIN = "# BEGIN workflow-frontend-e2e hosts";
const END = "# END workflow-frontend-e2e hosts";
const HOSTS_FILE = "/etc/hosts";

export type HostAlias = { ip: string; hostnames: string[] };

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripManagedBlock(contents: string): string {
    const block = new RegExp(
        `\\n?${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}\\n?`,
        "g",
    );
    return contents.replace(block, "");
}

// Rewrite the whole file in place via `sudo tee` (truncate + write, no rename):
// /etc/hosts is a Docker bind-mount, so `sed -i`/rename-based edits fail with
// "Device or resource busy". The dev container provides passwordless sudo.
function writeHostsFile(contents: string): void {
    execFileSync("sudo", ["-n", "tee", HOSTS_FILE], {
        input: contents,
        stdio: ["pipe", "ignore", "pipe"],
    });
}

/**
 * Map the local stack's service hostnames to their container bridge IPs in
 * /etc/hosts, so the host-run Play app and the browser resolve them exactly as
 * they would inside the Docker network. Replaces any block from a previous run.
 */
export function writeHostAliases(aliases: HostAlias[]): void {
    const base = stripManagedBlock(
        fs.readFileSync(HOSTS_FILE, "utf8"),
    ).replace(/\n*$/, "\n");
    const lines = aliases
        .filter((alias) => alias.hostnames.length > 0)
        .map((alias) => `${alias.ip} ${alias.hostnames.join(" ")}`);
    const block = `${BEGIN}\n${lines.join("\n")}\n${END}\n`;
    writeHostsFile(`${base}${block}`);
}

export function removeHostAliases(): void {
    const stripped = stripManagedBlock(fs.readFileSync(HOSTS_FILE, "utf8"));
    writeHostsFile(stripped);
}

