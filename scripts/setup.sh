#!/bin/bash

red='\x1B[0;31m'

test $(which yarn)
if [ $? != "0" ]; then
    echo -e "\n\r\n\r${red}yarn not found: please install yarn from https://yarnpkg.com/${plain}\n\r or run 'npm install -g yarn'"
    echo -e "Yarn is not required for the application (but is for the scripts)"
    echo -e "Packages can be manually installed with npm\n\r\n\r"

    exit 1
fi

printf "\n\rSetting up client side dependancies... \n\r\n\r"
printf "\n\rInstalling NPM packages via yarn... \n\r\n\r"

yarn

printf "\n\rCompiling Javascript... \n\r\n\r"

yarn build

printf "\n\rDone.\n\r\n\r"