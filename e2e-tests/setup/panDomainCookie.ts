// createCookie is not re-exported from the package root, so import the module path.
import { createCookie } from "@guardian/pan-domain-node/dist/src/panda.js";

/** Panda's standard asymmetric cookie name. */
export const PAN_DOMAIN_COOKIE_NAME = "gutoolsAuth-assym";

/**
 * Test roles -> emails. Each email must have a matching entry in
 * fixtures/permissions/permissions.json (granting or denying workflow access).
 */
export const roles = {
  default: "workflow.e2e.test@guardian.co.uk",
  noWorkflowAccess: "no.workflow@guardian.co.uk",
} as const;

export type Role = keyof typeof roles;

export function createPanDomainCookie(
  privateKeyPem: string,
  role: Role = "default",
  expiresInMs = 60 * 60 * 1000,
): string {
  return createCookie(
    {
      firstName: "Playwright",
      lastName: "Tester",
      email: roles[role],
      authenticatingSystem: "workflow",
      authenticatedIn: ["workflow"],
      expires: Date.now() + expiresInMs,
      multifactor: true,
    },
    privateKeyPem,
  );
}
