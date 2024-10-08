# Workflow

Workflow is part of the Guardian's Digital CMS, used for tracking content in production. 

There are two repos, frontend and backend.

This repo contains the *frontend* app for workflow.

Configuration for workflow-frontend is stored in S3. For the location of the configuration files, see the editorial-tools-platform repository (private).

The backend of workflow is kept in a separate open-source repo [here](https://github.com/guardian/workflow).

## workflow-frontend

The Angular frontend and associated Scala API for Workflow. 

### Install Prerequisites

 * jenv
 * nvm
 
You will need `workflow` and `capi` (API Gateway invocation) credentials from Janus.

In order to run, workflow-frontend needs to talk to a workflow datastore and a preferences datastore.
It can use either a local store, or CODE.

### Common installation steps

 1. Run the setup script `./scripts/setup.sh`
 2. Download the DEV config: `./scripts/fetch-config.sh`

If you encounter a `Module build failed` error due to Node Sass during set up, run `npm rebuild node-sass`.

Certain functionality will require running other services locally, e.g. you should run [atom-workshop](https://github.com/guardian/atom-workshop) locally if you want to test creating a Chart atom through Workflow.

Note: when running Workflow Frontend locally, some functionality will currently not work. 

  * Connect to CAPI
  * Presence 
  * 'Assign to me'

#### CODE config

Create an SSH tunnel to a workflow-frontend CODE instance.
You will need [ssm-scala](https://github.com/guardian/ssm-scala) installed for this script to work.

  * Run the script `./scripts/setup-ssh-tunnel.sh` 

#### Local config

  * Set up workflow (aka workflow backend).
  * Check it is working:
  
    `curl -is http://localhost:9095/management/healthcheck`

### Run

To run workflow-frontend, run the start script `./scripts/start.sh`. Then navigate to https://workflow.local.dev-gutools.co.uk

### Deploy

This project is setup for continuous deployment on `main`, if you suspect your
change has not deployed then look for the 
`Editorial Tools::Workflow::Workflow Frontend` project in RiffRaff.

### Admin Permissions
The `/admin` path allows the user to manage desks and sections. 
Not all users that have access to workflow have access to admin - the Permissions service controls access.
