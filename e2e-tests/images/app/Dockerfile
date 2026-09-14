# syntax=docker/dockerfile:1
# Toolchain-only image for workflow-frontend. The repo is bind-mounted at runtime
# (never COPYd in), so source edits reload without an image rebuild.
FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive AWS_SDK_LOAD_CONFIG=1
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl bash git openssl unzip \
    && rm -rf /var/lib/apt/lists/*
ENV MISE_DATA_DIR=/mise MISE_CONFIG_DIR=/mise MISE_CACHE_DIR=/mise/cache \
    MISE_INSTALL_PATH=/usr/local/bin/mise PATH="/mise/shims:$PATH"
RUN curl https://mise.run | sh
WORKDIR /app
COPY .tool-versions ./
# Install the toolchain, add classic yarn, and record the tool bin dirs so the
# runtime can put them on PATH directly (the bind-mounted repo's mise.toml is
# untrusted and pins tools we don't want, so we never run mise against it).
RUN mise trust -a && mise install java nodejs sbt aws-cli \
    && mise exec nodejs -- npm install -g yarn \
    && mise bin-paths > /etc/mise-bin-paths
EXPOSE 9090
CMD ["bash", "/workflow-frontend/e2e-tests/images/start-app"]
