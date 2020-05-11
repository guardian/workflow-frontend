# Workflow

Workflow is part of the Guardian's Digital CMS, used for tracking content in production. 

There are two repos, frontend and backend.

This repo contains the *frontend* app for workflow.

The backend of workflow is kept in a separate open-source repo [here](https://github.com/guardian/workflow).

## workflow-frontend

The Angular frontend and associated Scala API for Workflow. 

### Install Prerequisites

 * jenv
 * nvm
 
You will need `workflow` and `capi` (API Gateway invocation) credentials from Janus.

In order to run, workflow-frontend needs to talk to the a workflow datastore and a preferences datastore.
It can use either a local store, or CODE.

### Common installation steps

 1. Make sure that you are running the right version of nodejs, (tested and working with v6.1.0). We recommend using [nvm](https://github.com/creationix/nvm) to easily manage multiple versions of node. With this you can use `nvm use` to switch to this version quickly.
 1. Run the install script `./scripts/setup.sh`
 1. Download the DEV config: `./scripts/fetch-config.sh`
 1. Run the `setup-app.rb` in the `dev-nginx` repo with the `nginx/nginx-mapping.yml` file in this repo
 1. Check out [preferences](https://github.com/guardian/editorial-preferences) and follow the README instructions carefully to get it running locally. 

If you encounter a `Module build failed` error due to Node Sass during set up, run `npm rebuild node-sass`.

#### CODE config

Create an SSH tunnel to a workflow-frontend CODE instance.
You will need [ssm-scala](https://github.com/guardian/ssm-scala) installed for this script to work.

  * Run the script `./scripts/setup-ssh-tunnel.sh` 

#### Local config

NB At present, the Play Framework version does not support https as well as it should.

  * Set up workflow (aka workflow backend).
  * Check it is working:
  
  
    curl -is http://localhost:9095/management/healthcheck

Open `/etc/gu/workflow-frontend.private.conf` and amend `api.url` as follows:

    api.url="http://localhost:9095/api"

You can check that you have workflow backend running with 

### Run

To run workflow-frontend, run the start stript `./scripts/start.sh`. Then navigate to https://workflow.local.dev-gutools.co.uk

The lambda that sends notifications does not run automatically locally. You can invoke it:

```
sbt notification/run
```

Due to [Classloader issues](https://github.com/web-push-libs/webpush-java/issues/65) it cannot be run more than once in
a single SBT session. Unfortunately you must run a new instance of SBT each time.

### Deploy

This project is setup for continuous deployment on `master`, if you suspect your
change has not deployed then look for the 
`Editorial Tools::Workflow::Workflow Frontend` project in RiffRaff.

### Admin Permissions

The `/admin` path allows the user to manage desks and sections. Not all users that have access to workflow have access to admin. Currently admin permissions are managed by adding email addresses to the private conf file stored in s3 and doing a redeploy. Long term this should be changed to used the [permissions app](https://permissions.gutools.co.uk/) so that permissions management is consistent across tools. 
