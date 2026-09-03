# Mock of the Guardian user-telemetry API used by the local stack.
# WireMock serves stub responses over https; Chromium host-resolver-rules routes
# user-telemetry.local.dev-gutools.co.uk to this container's https port.
FROM wiremock/wiremock:3.13.2

# Allow WireMock to bind to the privileged port 80.
USER root

# Bake in the stub mappings.
COPY fixtures/telemetry-mappings/telemetry.json /home/wiremock/mappings/telemetry.json

EXPOSE 80 8443

CMD ["--port", "80", "--https-port", "8443", "--verbose", "--local-response-templating"]
