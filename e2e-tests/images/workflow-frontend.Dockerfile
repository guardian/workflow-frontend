# syntax=docker/dockerfile:1
# workflow-frontend app image for e2e. Mirrors datastore.Dockerfile: the image
# only bakes the toolchain (java, nodejs, sbt, aws-cli via mise); the whole repo
# (including node_modules) is bind-mounted at runtime, so webpack (build-dev
# watch) and Play dev-mode run from source without an image rebuild.
#
# The build context is a tiny temp folder holding just .tool-versions, so the
# image build never has to copy the repo.
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

WORKDIR /workflow-frontend

# Install the toolchain (java, nodejs, sbt, aws-cli) via mise and enable corepack
# so `yarn` is available. This is the only thing baked into the image; the repo
# and its node_modules are bind-mounted at runtime.
COPY .tool-versions ./
RUN mise trust -a && mise install java nodejs sbt aws-cli \
    && mise exec nodejs -- npm install -g corepack \
    && mise exec nodejs -- corepack enable

EXPOSE 9090

# Run webpack in watch mode alongside Play dev-mode `run` so mounted source edits
# rebuild assets and recompile the app without rebuilding the image.
CMD ["bash", "-c", "mise exec -- yarn build-dev & exec bash /workflow-frontend/e2e-tests/images/start-workflow-frontend"]