#!/bin/bash

cd $(dirname "$0");

# Remove local packages to ensure latest versions are downloaded
rm -rf node_modules/

echo "Installing nodejs packages"

npm install
NPM_EXIT=$?

if [ $NPM_EXIT != "0" ]; then
    exit 1
fi

echo "Bundling with webpack"

npm run build-dev
NPM_EXIT=$?

if [ $NPM_EXIT != "0" ]; then
    exit 1
fi
