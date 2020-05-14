#!/usr/bin/env bash

set -e

for arg in "$@"; do
  if [ "$arg" == "--ship-logs" ]; then
    export LOCAL_LOG_SHIPPING=true
    shift
  fi
done

yarn build-dev &
sbt run
