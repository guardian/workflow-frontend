import { createCookie } from "@guardian/pan-domain-node/dist/src/panda";
import { base64ToPEM } from "@guardian/pan-domain-node/dist/src/utils";

/**
 * Maps test roles to the email addresses used when signing the pan-domain cookie.
 *
 * Each email here must correspond to a userId override in the permissions fixture
 * (`fixtures/permissions/permissions.json`), which is what grants or denies
 * `workflow_access` for that user. Adding a role here without a matching entry in
 * the fixture means the cookie's email won't resolve to the expected permissions.
 *
 * - `default`: `workflow.e2e.test@guardian.co.uk` — has `workflow_access`.
 * - `NoWorkflowAccess`: `no.workflow@guardian.co.uk` — does NOT have `workflow_access`.
 */
export const roles = {
    default: "workflow.e2e.test@guardian.co.uk",
    NoWorkflowAccess: "no.workflow@guardian.co.uk",
} as const;

export type Role = keyof typeof roles;

function formatPrivateKeyForSigning(rawPrivateKey: string): string {
    const trimmedKey = rawPrivateKey.trim();

    if (trimmedKey.includes("-----BEGIN")) {
        return trimmedKey.replace(/\\n/g, "\n");
    }

    const normalizedBase64Key = trimmedKey
        .replace(/\\n/g, "")
        .replace(/\s+/g, "");

    return base64ToPEM(normalizedBase64Key, "RSA PRIVATE");
}

export function createPanDomainCookie(rawPrivateKey: string, role: Role = "default"): string {
    if (!rawPrivateKey) {
        throw new Error("privateKey was not supplied to createPanDomainCookie");
    }

    const privateKey = formatPrivateKeyForSigning(rawPrivateKey);
    return createCookie(
        {
            firstName: "Playwright",
            lastName: "Tester",
            email: roles[role],
            authenticatingSystem: "workflow-frontend",
            authenticatedIn: ["workflow-frontend"],
            expires: Date.now() + 60 * 60 * 1000,
            multifactor: true,
        },
        privateKey,
    );
}
