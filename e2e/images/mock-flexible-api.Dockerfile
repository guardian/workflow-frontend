# Mock of the flexible-content (Composer) API used by the local stack.
# Runs the TypeScript stub directly with tsx — the server only uses Node
# built-ins, so no project dependencies need to be installed.
FROM node:20-alpine

RUN npm install -g tsx@4.22.4

WORKDIR /app

COPY e2e/setup/mockFlexibleApi/server.ts ./server.ts
COPY e2e/fixtures/responses/workflow-list.json ./fixtures/workflow-list.json

ENV PORT=8080
EXPOSE 8080

CMD ["tsx", "server.ts"]
