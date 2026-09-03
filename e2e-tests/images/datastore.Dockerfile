# syntax=docker/dockerfile:1
# Real Workflow Datastore backend service, built from the guardian/workflow
# checkout in target/workflow-backend. Mirrors workflow-frontend.Dockerfile:
# tooling is installed via mise and the Play app
# is run from source with the e2e config overlay.
#
# The docker build context for this image is the workflow-backend checkout
# (target/workflow-backend), so all COPY paths below are relative to that.
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
RUN mise trust -a && mise install

WORKDIR /workflow-backend

# Install JVM tooling (java, sbt, ...) via mise using the e2e environment.
COPY .tool-versions ./
RUN mise install java sbt

# Pre-fetch JVM dependencies. Layer-cached after this point: only re-runs when
# build.sbt or project/ changes.
COPY build.sbt ./
COPY project ./project
RUN mise exec java sbt -- sbt -batch update

# Compile the Datastore service and its shared library. Only re-runs when the
# Scala sources change.
COPY common-lib ./common-lib
COPY datastore ./datastore
RUN mise exec java sbt -- sbt -batch datastore/compile

# Copy remaining runtime files (e2e config, db scripts, etc.).
COPY . .

EXPOSE 8080

# Run the Datastore from source with the e2e config overlay, serving on 8080
# (the port the frontend expects the backend at).
CMD ["mise", "exec", "java", "sbt", "--", "sbt", "-Dconfig.file=datastore/conf/application.e2e.conf", "datastore/run 9095"]
