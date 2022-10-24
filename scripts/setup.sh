#!/bin/bash

set -e

red='\x1B[0;31m'

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR=${DIR}/..

preamble() {
  if [[ -z "$JAVA_HOME" ]]; then
      echo -e "\r${red}JAVA_HOME must be set" 1>&2
      echo "This can be done by adding \"export JAVA_HOME=\`/usr/libexec/java_home\`\" to your ~/.profile"
      exit 1
  fi

  if test -e "$NVM_DIR/nvm.sh"; then
      source "$NVM_DIR/nvm.sh"
      nvm install
  elif command -v fnm >/dev/null; then
      fnm use
  # TODO use asdf? add detection and enable here
  else
      echo -e "No node version manager found. Consider installing fnm <https://github.com/Schniz/fnm> or asdf <???>"
      exit 1
  fi
}

installDependencies() {
  echo "Installing dependencies"

  brew bundle --file="$ROOT_DIR/Brewfile"
  echo "  homebrew dependencies installed"

  yarn
  echo "  yarn dependencies installed"
}

setupDevNginx() {
  echo "Setting up dev-nginx"
  dev-nginx setup-app "$ROOT_DIR/nginx/nginx-mapping.yml"
}

end() {
  echo "PSST! Workflow calls to a number of other Tools in CODE."
  echo "  You need a cookie for these requests to succeed."
  echo "  Visit https://workflow.code.dev-gutools.co.uk to get a cookie."
}

main() {
  preamble
  installDependencies
  setupDevNginx
  end
}

main
