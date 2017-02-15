# workflow-frontend
The Angular frontend and associated Scala API for Workflow. 

### Install

In order to run, workflow-frontend needs to talk to the CODE workflow datastore. It does this via an SSH tunnel to a 
workflow-frontend CODE instance.

- Make sure that you are running the right version of nodejs, should be v0.10.45. 
- Run the install script `./setup.sh` 
- In the `conf` folder copy `workflow-frontend-application.local-example.conf` into `workflow-frontend-application.local.conf` and edit it to replace *example.email@guardian.co.uk* by your Guardian email address.
- Run the script `./setup-ssh-tunnel.sh` to set up an ssh tunnel to a CODE datastore instance. You will need [marauder]()
    installed for this script to work. If the script fails, you could also run the command ssh -f ubuntu@<WORKFLOW-FRONTEND-CODE-INSTANCE> -L 5002:$<DATASTORE-ELB>:80 -N

### Run

To run workflow-frontend, just do `sbt run`. Then navigate to https://workflow.local.dev-gutools.co.uk