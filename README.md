# workflow-frontend
The Angular frontend and associated Scala API for Workflow. 

### Install

You will need `workflow` and `capi` (API Gateway invocation) credentials from Janus.

In order to run, workflow-frontend needs to talk to the CODE workflow datastore. It does this via an SSH tunnel to a 
workflow-frontend CODE instance.

- Make sure that you are running the right version of nodejs, (tested and working with v6.1.0). We recommend using [nvm](https://github.com/creationix/nvm) to easily manage multiple versions of node. With this you can use `nvm use` to switch to this version quickly.
- Run the install script `./scripts/setup.sh`
- Download the DEV config: `aws s3 cp s3://workflow-private/DEV/workflow-frontend/applications.defaults.conf /etc/gu/workflow-frontend.private.conf --profile workflow`
- Run the script `./scripts/setup-ssh-tunnel.sh` to set up an ssh tunnel to a CODE datastore instance. You will need [ssm-scala](https://github.com/guardian/ssm-scala) installed for this script to work.
- Run the `setup-app.rb` in the `dev-nginx` repo with the `nginx/nginx-mapping.yml` file in this repo

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
