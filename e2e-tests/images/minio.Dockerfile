FROM alpine:3.19

RUN apk add --no-cache aws-cli curl && \
    curl -fsSL https://dl.min.io/server/minio/release/linux-arm64/minio -o /usr/local/bin/minio && \
    chmod +x /usr/local/bin/minio

COPY images/start-minio-with-buckets /usr/local/bin/start-minio-with-buckets
COPY fixtures/permissions/permissions.json /opt/minio-fixtures/permissions/permissions.json
COPY fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings /opt/minio-fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings
COPY fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings.public /opt/minio-fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings.public

RUN chmod +x /usr/local/bin/start-minio-with-buckets

EXPOSE 9000 9001

ENTRYPOINT ["/usr/local/bin/start-minio-with-buckets"]
