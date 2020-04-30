#!/bin/bash

aws s3 \
  --profile workflow \
  cp s3://workflow-private/DEV/workflow-frontend/applications.defaults.conf /etc/gu/workflow-frontend.private.conf



