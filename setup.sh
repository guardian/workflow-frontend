#/bin/bash

echo "Installing nodejs packages"
npm install

pushd public

  echo "Installing jspm client-side packages"
  ## Temp override of xeditable
  ../node_modules/.bin/jspm install xeditable=github:vitalets/angular-xeditable -o "{main: 'dist/js/xeditable.min'}"
  ../node_modules/.bin/jspm install

popd
