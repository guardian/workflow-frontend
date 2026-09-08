# syntax=docker/dockerfile:1
# Real Workflow Datastore backend service, built from the guardian/workflow
# checkout in target/workflow-backend. Mirrors workflow-frontend.Dockerfile:
# the image only bakes the JVM toolchain (java + sbt via mise); the backend
# sources (build.sbt, project/, common-lib/, datastore/) are bind-mounted at
# runtime and the Play app is run from source with the e2e config overlay.
#
# The build context is a tiny temp folder holding just .tool-versions, so the
# image build never has to copy the whole backend checkout.
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV AWS_SDK_LOAD_CONFIG=1

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    bash \
    git \
    openssl \
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

# Install JVM tooling (java, sbt) via mise using the e2e environment. This is the
# only thing baked into the image; all backend sources are bind-mounted at runtime.
COPY .tool-versions ./
RUN mise trust -a && mise install java sbt

EXPOSE 9095

# Run the Datastore from source with the e2e config overlay, serving on 9095
# (the port the frontend expects the backend at). Sources are bind-mounted, so
# sbt resolves dependencies and compiles on first start.
CMD ["mise", "exec", "java", "sbt", "--", "sbt", "-Dconfig.file=datastore/conf/application.e2e.conf", "datastore/run 9095"]
