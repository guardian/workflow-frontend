# syntax=docker/dockerfile:1
FROM eclipse-temurin:11-jdk

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
ENV MISE_ENV="e2e"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"
RUN curl https://mise.run | sh
RUN mise trust -a && mise install

WORKDIR /workflow-frontend

# Install Node and sbt via mise.
COPY mise.e2e.toml ./
RUN mise trust ./mise.e2e.toml \
    && mise install nodejs \
    && mise install sbt

# Pre-fetch JVM dependencies. Layer-cached after this point: only re-runs when
# build.sbt or project/ changes.
COPY build.sbt ./
COPY project ./project
RUN mise exec -- sbt -batch update

# Install npm dependencies. Only re-runs when package.json/yarn.lock changes.
COPY package.json yarn.lock ./
RUN mise exec -- npm install -g corepack \
    && mise exec -- corepack enable \
    && mise exec -- yarn install

# Warm up the Scala incremental compiler caches (target/, zinc). The sources are
# bind-mounted at runtime, so these copies are only used to prime the build;
# unchanged files then start fast, changed ones recompile incrementally.
COPY app ./app
COPY common-lib ./common-lib
COPY conf ./conf
RUN mise exec -- sbt -batch compile

# Copy remaining runtime files (scripts, fixtures, nginx config, etc.). Heavy
# build artifacts and the e2e-tests/target checkout are excluded via .dockerignore.
# app/, common-lib/, conf/ and public/ are bind-mounted over these at runtime.
COPY . .
RUN chmod +x /workflow-frontend/e2e-tests/images/start-workflow-frontend

EXPOSE 9090

# Run webpack in watch mode alongside Play dev-mode `run` so mounted source edits
# rebuild assets and recompile the app without rebuilding the image.
CMD ["bash", "-c", "mise exec -- yarn build-dev & exec /workflow-frontend/e2e-tests/images/start-workflow-frontend"]