#/bin/bash

echo "Installing nodejs packages"
npm install

pushd public

  echo "Installing jspm client-side packages"
  ../node_modules/.bin/jspm install

popd
