#!/usr/bin/env bash

set -e

setupNvm() {
  if ! test -e "$NVM_DIR/nvm.sh"; then
    echo -e "NVM not found. NVM is required to run this project."
    exit 1
  else
    source "$NVM_DIR/nvm.sh"
    nvm install
  fi
}

buildJs() {
  echo "##teamcity[compilationStarted compiler='webpack']"
  setupNvm

  npm install yarn -g

  yarn
  yarn build
  echo "##teamcity[compilationFinished compiler='webpack']"
}

buildSbt() {
  echo "##teamcity[compilationStarted compiler='sbt']"
  sbt clean compile test riffRaffNotifyTeamcity
  echo "##teamcity[compilationFinished compiler='sbt']"
}

buildJs
buildSbt
