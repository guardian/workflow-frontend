import { existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { BACKEND_DIR } from "./constants.js";

/**
 * Ensure the run-for-real datastore (private guardian/workflow) is checked out at
 * BACKEND_DIR. In CI this is done by actions/checkout with a GitHub App token, so
 * if the dir already exists we do nothing. Locally it clones via the developer's
 * git credentials.
 */
const REPO = process.env.WORKFLOW_BACKEND_REPO ?? "https://github.com/guardian/workflow.git";
const REF = process.env.WORKFLOW_BACKEND_REF ?? "main";

function checkoutBackend(): void {
  if (existsSync(BACKEND_DIR)) {
    console.log(`[checkout-backend] using existing checkout at ${BACKEND_DIR}`);
    return;
  }
  console.log(`[checkout-backend] cloning ${REPO}@${REF} into ${BACKEND_DIR}`);
  mkdirSync(dirname(BACKEND_DIR), { recursive: true });
  execFileSync(
    "git",
    ["clone", "--depth", "1", "--branch", REF, REPO, BACKEND_DIR],
    { stdio: "inherit" },
  );
}

checkoutBackend();
