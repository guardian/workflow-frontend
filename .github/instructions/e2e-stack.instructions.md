---
applyTo: "e2e-tests/setup/**,e2e-tests/images/**"
description: "Conventions for the e2e Testcontainers stack code and its Dockerfiles."
---

# E2E stack conventions

Rules for the local-stack setup code under `e2e-tests/setup/` and the Dockerfiles
under `e2e-tests/images/`. Background and rationale live in the
`e2e-test-setup` skill's [reference playbook](../skills/e2e-test-setup/reference/e2e-playbook.md).

## Dockerfiles
- Base app/backend images on `debian:bookworm-slim` (glibc). Do **not** use
  Alpine for images that run a JDK or use `apt-get`.
- Bake **only the toolchain** (via `mise` from a copied `.tool-versions`); never
  `COPY` application/backend source into the image — it is bind-mounted at
  runtime.
- Keep the build context tiny: build from a temp dir holding just
  `.tool-versions` + the Dockerfile.
- Start every Dockerfile with the `# syntax=docker/dockerfile:1` directive.

## Container start code
- Create exactly one `Network` per stack run; stop it and every started
  container in the failure path and in `stopLocalStack`.
- Prefer stock images with bind-mounted fixtures/config over bespoke images
  (WireMock, LocalStack, Postgres, nginx).
- Run all mocks from the single shared WireMock image via `MOCK_WIREMOCK_CONFIGS`
  + `startMockWiremock`; add a mock by adding a fixture folder and a table entry,
  not a Dockerfile.
- Give each service a network alias matching the real upstream hostname so the
  app resolves it inside the Docker network without config overrides.
- Every container must have an explicit `Wait` strategy (log message or HTTP
  healthcheck) and a sensible `withStartupTimeout`.
- Bind-mount source read-write only where the toolchain writes (`target/`,
  `public/build`); mount fixtures read-only.
- Seed datastores from the host after the container is ready; seed the SQL DB
  only after the owning service's migrations have created the schema, parents
  before FK children.

## Safety
- Never commit real secrets, tokens or personal data into `e2e-tests/fixtures/`
  — use synthetic values.
- Keep the production app change footprint minimal (env-gated switches only).

## Guiding principles
- The code lives at the dev-container root; when a Docker image runs the app
  (CI / `test:ci`), it **bind-mounts** the code, never copies it in.
- Run the app **natively** in dev; containerise only for CI / `test:ci`.
- Provide anything a browser needs (cookies, routing) **server-side** so `dev` /
  `dev:local` need no forced cookies or browser mocks.
