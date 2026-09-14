# syntax=docker/dockerfile:1
# Toolchain-only image for the run-for-real datastore (guardian/workflow).
# The checkout is bind-mounted at runtime; sbt resolves/compiles on first start.
FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl bash git openssl \
    && rm -rf /var/lib/apt/lists/*
ENV MISE_DATA_DIR=/mise MISE_CONFIG_DIR=/mise MISE_CACHE_DIR=/mise/cache \
    MISE_INSTALL_PATH=/usr/local/bin/mise PATH="/mise/shims:$PATH"
RUN curl https://mise.run | sh
WORKDIR /app
COPY .tool-versions ./
RUN mise trust -a && mise install java sbt
COPY start-datastore /usr/local/bin/start-datastore
RUN chmod +x /usr/local/bin/start-datastore
EXPOSE 9093
CMD ["bash", "/usr/local/bin/start-datastore"]
