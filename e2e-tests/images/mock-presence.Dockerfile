# Mock of the Guardian presence service for the local stack.
# WireMock serves the stub presence client library over https; Chromium
# host-resolver-rules routes presence.local.dev-gutools.co.uk to this container's
# https port. The stub avoids any WebSocket; e2e tests drive presence updates
# client-side via window.__presenceMock__.
FROM wiremock/wiremock:3.13.2

# Allow WireMock to bind to the privileged port 80.
USER root

# Bake in the stub mapping and the client-library body. Only the mapping goes
# under mappings/; the body lives in __files/ so WireMock doesn't try to load it
# as a stub.
COPY fixtures/presence-mappings/lib.json /home/wiremock/mappings/lib.json
COPY fixtures/presence-mappings/presence-client-lib.js /home/wiremock/__files/presence-client-lib.js

EXPOSE 80 8443

CMD ["--port", "80", "--https-port", "8443", "--verbose"]
