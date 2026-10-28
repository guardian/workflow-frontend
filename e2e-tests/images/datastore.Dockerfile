# syntax=docker/dockerfile:1
# Real Workflow Datastore backend service, built from the guardian/workflow
# checkout in target/workflow-backend. Mirrors workflow-frontend.Dockerfile:
# the image bakes the JVM toolchain (java + sbt via mise) and local CA; the backend
# sources (build.sbt, project/, common-lib/, datastore/) are bind-mounted at
# runtime and the Play app is run from source with the e2e config overlay.
#
# The build context holds .tool-versions, the Dockerfile and public CA certificate,
# so the image build never has to copy the whole backend checkout.
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV AWS_SDK_LOAD_CONFIG=1
ENV CAROOT=/etc/workflow-local-ca
ENV TRUST_STORES=java

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    bash \
    git \
    openssl \
    mkcert \
    && rm -rf /var/lib/apt/lists/*

# Install mise
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"
RUN curl https://mise.run | sh

WORKDIR /workflow-backend

# Install JVM tooling (java, sbt) via mise using the e2e environment. The toolchain
# and CA are baked into the image; all backend sources are bind-mounted at runtime.
# It also caches the mise cache directory to speed up subsequent builds.
COPY .tool-versions ./
RUN --mount=type=cache,target=/mise/cache,sharing=locked \
    mise trust -a && mise install java sbt

COPY rootCA.pem /etc/workflow-local-ca/rootCA.pem
RUN mise exec java -- mkcert -install

EXPOSE 9095

# Run the Datastore from source with the e2e config overlay, serving on 9095
# (the port the frontend expects the backend at). Sources are bind-mounted, so
# sbt resolves dependencies and compiles on first start.
CMD ["mise", "exec", "java", "sbt", "--", "sbt", "-Dconfig.file=datastore/conf/application.e2e.conf", "datastore/run 9095"]
