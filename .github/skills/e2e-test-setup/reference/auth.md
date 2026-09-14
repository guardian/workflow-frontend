# Reference: pan-domain auth (no OAuth)

Captured essence of the auth helpers and the pan-domain settings fixture. The
goal: authenticate test/dev requests without the real OAuth flow, entirely
**server-side** so local dev needs no forced client cookie.

## Per-run signing keys — `generatePanDomainKeys`

Generate a fresh RSA keypair per run and expose PEM + base64 forms:

```ts
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
// pemToBase64 strips the -----BEGIN/END----- armour and whitespace
return { privateKeyPem, privateKeyBase64, publicKeyBase64 };
```

## Settings fixture

Reuse the mocked pan-domain settings fixture as-is (a static
`fixtures/pan-domain-settings/<domain>.settings` + `.settings.public`). At seed
time the per-run keys are **appended** to it before upload to S3:

```ts
const settings = readFileSync(settingsFixture) +
  `publicKey=${keys.publicKeyBase64}\n` + `privateKey=${keys.privateKeyBase64}\n`;
// upload settings (+ a .public variant with only the public key) to the
// pan-domain-auth-settings bucket (see seeding.md)
```

## Signing a cookie — `createPanDomainCookie` / `signIn`

Tests sign a cookie with the private key using `@guardian/pan-domain-node`'s
`createCookie`. Roles map to emails; each email must have a matching entry in the
permissions fixture that grants/denies access.

```ts
export const roles = {
  default: "workflow.e2e.test@guardian.co.uk",       // has access
  NoWorkflowAccess: "no.workflow@guardian.co.uk",     // denied
} as const;

createCookie({
  firstName: "Playwright", lastName: "Tester", email: roles[role],
  authenticatingSystem: "workflow-frontend", authenticatedIn: ["workflow-frontend"],
  expires: Date.now() + expiresInMs, multifactor: true,
}, privateKeyPem);
```

- **Local dev**: the cookie is issued **server-side** by the nginx auth-redirect
  container (`/cookie`), so browsing under `dev:local` needs no forced client
  cookie.
- **Headless tests**: a `signIn` fixture sets the signed cookie on the browser
  context before navigating.
- Role emails must match entries in the permissions fixture (see the
  permissions-cache guidance in the fixtures skill).
