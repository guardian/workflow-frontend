# Reference: toolchain-only Dockerfiles

Captured essence of the app and run-for-real-dependency images. These are used
**only for CI / `test:ci`** (in dev the app runs natively). The image bakes
**only the toolchain**; the code is bind-mounted at runtime, never copied.

## Shared shape

- Base `debian:bookworm-slim` (glibc — Corretto/JDK need it, so **not** Alpine;
  `apt-get` is available).
- Install `mise`, then the toolchain from a copied `.tool-versions`
  (`mise install ...`), then `corepack enable` for `yarn`.
- `# syntax=docker/dockerfile:1` directive at the top.
- The build context is a tiny temp dir holding just `.tool-versions` + the
  Dockerfile, so the build never copies the repo.
- `CMD` runs the app from the **bind-mounted** source in watch/dev mode.

## App image (essence)

```dockerfile
# syntax=docker/dockerfile:1
FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive AWS_SDK_LOAD_CONFIG=1
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl bash git openssl && rm -rf /var/lib/apt/lists/*
ENV MISE_DATA_DIR=/mise MISE_CONFIG_DIR=/mise MISE_CACHE_DIR=/mise/cache \
    MISE_INSTALL_PATH=/usr/local/bin/mise PATH="/mise/shims:$PATH"
RUN curl https://mise.run | sh
WORKDIR /app
COPY .tool-versions ./
RUN mise trust -a && mise install java nodejs sbt aws-cli \
    && mise exec nodejs -- npm install -g corepack && mise exec nodejs -- corepack enable
EXPOSE 9090
# run asset watch + dev-mode server from the mounted source
CMD ["bash", "-c", "mise exec -- yarn build-dev & exec bash /app/e2e-tests/images/start-app"]
```

## Run-for-real dependency image (essence)

Same base + mise pattern, JVM toolchain only (`mise install java sbt`), then run
the service from source with the e2e config overlay, e.g.:

```dockerfile
CMD ["mise","exec","java","sbt","--","sbt","-Dconfig.file=<svc>/conf/application.e2e.conf","<svc>/run 9095"]
```

The service's sources are bind-mounted read-write at runtime (sbt writes
`target/`); it resolves dependencies and compiles on first start, so give it a
long startup timeout.
