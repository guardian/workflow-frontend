#!/bin/bash

aws s3 \
  --profile workflow \
  cp s3://workflow-private/DEV/workflow-frontend-application.local.conf ~/.gu/workflow-frontend-application.local.conf
