#/bin/bash

echo "Installing nodejs packages"
npm install
NPM_EXIT=$?

if [ $NPM_EXIT != "0" ]; then
    exit 1
fi

pushd public

  echo "Installing jspm client-side packages"
  ../node_modules/.bin/jspm install

  JSPM_EXIT=$?
popd


if [ $JSPM_EXIT == "0" ]; then
    exit 0
else
    exit 1
fi
