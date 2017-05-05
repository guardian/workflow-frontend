#!/bin/bash

cd $(dirname "$0");

# Remove local packages to ensure latest versions are downloaded
rm -rf ../node_modules/ ../public/jspm_packages/ 

echo "Installing nodejs packages"

npm install
NPM_EXIT=$?

if [ $NPM_EXIT != "0" ]; then
    exit 1
fi


echo "Installing jspm client-side packages"
../node_modules/.bin/jspm install -y

JSPM_EXIT=$?


if [ $JSPM_EXIT != "0" ]; then
    echo "Failed jspm install"
    exit 1
fi
