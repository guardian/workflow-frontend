# workflow-frontend
The Angular frontend and associated Scala API for Workflow. 

### Install

In order to run, workflow-frontend needs to talk to the CODE workflow datastore. It does this via an SSH tunnel to a 
workflow-frontend CODE instance.

- Make sure that you are running the right version of nodejs (tested and working with v6.1.0). We recommend using [nvm](https://github.com/creationix/nvm) to easily manage multiple versions of node. With this you can use `nvm use` to switch to this version quickly.
- Run the install script `./scripts/setup.sh`

- In the `conf` folder copy `workflow-frontend-application.local-example.conf` into `workflow-frontend-application.local.conf` and edit it to replace *example.email@guardian.co.uk* by your Guardian email address.
- Run the script `./scripts/setup-ssh-tunnel.sh` to set up an ssh tunnel to a CODE datastore instance. You will need [marauder]()
    installed for this script to work. If the script fails, you could also run the command `ssh -f ubuntu@<WORKFLOW-FRONTEND-CODE-INSTANCE> -L 5002:$<DATASTORE-ELB>:80 -N`
- Run the `setup-app.rb` in the `dev-nginx` repo with the `nginx/nginx-mapping.yml` file in this repo

### Run

To run workflow-frontend, run the start script `./scripts/start.sh`. Then navigate to https://workflow.local.dev-gutools.co.uk
