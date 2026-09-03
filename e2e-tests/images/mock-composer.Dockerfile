# Mock of the Composer API used by the local stack.
# WireMock serves baked-in stub mappings. HTTPS is enabled because the browser
# calls Composer cross-origin over https; Chromium host-resolver-rules routes
# composer.local.dev-gutools.co.uk to this container's https port.
FROM wiremock/wiremock:3.13.2

# Allow WireMock to bind to the privileged port 80.
USER root

# Bake in the stub mapping and the content body served on create. Only the
# mapping goes under mappings/; the body lives in __files/ so WireMock doesn't
# try to load it as a stub.
COPY fixtures/composer-mappings/content.json /home/wiremock/mappings/content.json
COPY fixtures/composer-mappings/composerContent.json /home/wiremock/__files/composerContent.json

EXPOSE 80 8443

CMD ["--port", "80", "--https-port", "8443", "--verbose", "--local-response-templating"]
