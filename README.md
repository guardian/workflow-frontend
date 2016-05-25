# workflow-frontend
The Angular frontend and associated Scala API for Workflow. 

### Install

- Make sure that you are running the right version of nodejs, should be v0.10.45. 
- Run the install script `./setup.sh` 
- In the `conf` folder copy `workflow-frontend-application.local-example.conf` into `workflow-frontend-application.local.conf` and edit it to replace *example.email@guardian.co.uk* by your Guardian email address.

### Run

To run workflow-frontend, just do `sbt run`. Then navigate to https://workflow.local.dev-gutools.co.uk