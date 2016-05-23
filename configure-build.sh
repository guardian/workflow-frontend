#!/bin/bash

# only use this on circle to configure the aws build
function configure() {
    echo "Configuring workflow account..."
    echo -ne $WF_ACCESS_KEY '\n' $WF_SECRET_KEY '\n' eu-west-1 '\n' '\n' | aws configure --profile workflow
    echo "Configured workflow account..."
}

configure;
