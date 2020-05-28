#!/usr/bin/env bash

set -e

for arg in "$@"; do
  if [ "$arg" == "--debug" ]; then
    IS_DEBUG=true
    shift
  fi

  if [ "$arg" == "--ship-logs" ]; then
    export LOCAL_LOG_SHIPPING=true
    shift
  fi
done

EXTRA_SBT_ARGS=""
if [[ $IS_DEBUG == true ]]; then
  EXTRA_SBT_ARGS="-jvm-debug 5005"
fi

yarn build-dev &
# shellcheck disable=SC2086
sbt $EXTRA_SBT_ARGS run
