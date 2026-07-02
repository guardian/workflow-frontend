#!/bin/bash
if [ "$DEVCONTAINER" = "true" ]; then
  aws s3 \
    --profile workflow \
    cp s3://workflow-private/DEV/workflow-frontend-application.local.docker.conf ~/.gu/workflow-frontend-application.local.conf
else
  aws s3 \
    --profile workflow \
    cp s3://workflow-private/DEV/workflow-frontend-application.local.conf ~/.gu/workflow-frontend-application.local.conf
fi
