# Serves a host-reachable endpoint that sets the pan-domain auth cookie and
# redirects to the frontend, letting a host browser use the local e2e stack
# without the real OAuth flow. The cookie value is supplied at runtime via env.
FROM nginx:alpine

COPY fixtures/auth-redirect/auth-redirect.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
