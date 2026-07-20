# Mock of the tag-manager API used by the local stack.
# WireMock serves baked-in stub mappings over HTTP.
FROM wiremock/wiremock:3.13.2

# Allow WireMock to bind to the privileged port 80.
USER root

# Bake in the stub mappings so the mock responds without runtime registration.
COPY e2e/fixtures/tagmanager-mappings/ /home/wiremock/mappings/

EXPOSE 80

CMD ["--port", "80", "--verbose", "--local-response-templating"]
