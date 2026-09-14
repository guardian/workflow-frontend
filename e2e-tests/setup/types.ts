import type { StartedTestContainer, StartedNetwork } from "testcontainers";

/** Connection details written to disk so per-test fixtures can reach the stack. */
export interface StackConnection {
  /** Base URL the Playwright browser loads the app from (plain http, forwarded port). */
  baseUrl: string;
  /** Pan-domain domain the auth cookie is scoped to. */
  cookieDomain: string;
  /** Per-run RSA private key (PEM) used to sign auth cookies in tests. */
  panDomainPrivateKeyPem: string;
  /** WireMock admin URLs, keyed by mock name, for asserting requests were made. */
  mockAdminUrls: Record<string, string>;
}

/** Full running stack, including container handles for teardown. */
export interface LocalStack extends StackConnection {
  network: StartedNetwork;
  containers: StartedTestContainer[];
}
