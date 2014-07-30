Workflow
========

AKA *Taxi*, *Kraken*

Development prerequisites
-------------------------

  * Install [SBT](http://www.scala-sbt.org/)
  * Get an account in the [aws-cms-workflow](https://aws-cms-workflow.signin.aws.amazon.com/console) AWS account
  * Set your region in the AWS console (drop-down menu in the top right corner) - you probably want to choose Ireland.
  * Create your own CloudFormation stack, using the developer template in `cloudformation/dev-template.json`. NB: Enter
    a unique stack name in the "Stage" parameter, e.g. "DEV-{username}"
	* Copy `prototype/conf/local-example.conf` to `prototype/conf/local.conf`
  * Copy `prole/conf/local-example.conf` to `prole/conf/local.conf`
  * Query the stack outputs (can be found in the Outputs tab for your stack in the AWS Console), and copy the values
    into `prototype/conf/local.conf` and `prole/conf/local.conf`
  * Find Google OAuth2 credentials found at https://console.developers.google.com/project/apps~gu-workflow and add these to `prototype/conf/local.conf`
  * Download our private keys from the `workflow-private` S3 bucket and put in /etc/gu/workflow-keys.conf.
    You will need an AWS account so ask another dev.
    If you have the AWS CLI set up you can run
      ```
      aws s3 cp s3://workflow-private/keys.conf /etc/gu/workflow-keys.conf
      ```

  * Setup and install client-side dependencies:

    ```
      cd prototype
      ./setup.sh
    ```


Running the application
-----------------------

### Nginx

To run correctly in standalone mode we run behind nginx, This can be installed as follows (you may have done
this already if you work with identity, r2 or similar):

1. Install nginx:
  * *Linux:*   ```sudo apt-get install nginx```
  * *Mac OSX:* ```brew install nginx```

2. Make sure you have a sites-enabled folder under your nginx home. This should be
  * *Linux:* ```/etc/nginx/sites-enabled```
  * *Mac OSX:* ```/usr/local/etc/nginx/```

3. Make sure your nginx.conf (found in your nginx home) contains the following line in the http{} block:
`include sites-enabled/*;`
  * you may also want to disable the default server on 8080

4. Run:

    ./nginx/setup.sh


You will also need to add the entries in /nginx/hosts into the hosts file on your computer.

### the apps

There are 2 Play! applications, so you can run prototype thus:

    $ sbt
    $ project prototype
    $ run [optional port number - default 9090]

and prole thus:

    $ sbt
    $ project prole
    $ run [optional port number - default 9091]

you will also need to kick prole into life by hitting ```http://localhost:9091/management/healthcheck``` - this forces
play to compile and start the app.

There are also hand start scripts in the project root that will, erm, start things for you

These will run the applications in development mode, so it automatically recompiles any changes when you make a request.
You can access your running workflow dashboard on ```https://workflow.local.dev-gutools.co.uk/```

Debugging in the cloud
----------------------

If you want to SSH to one of the EC2 instances:

  * Obtain a copy of the `workflow-developers` private key
  * Add it to your ssh agent using `ssh-add workflow-developers.pem`
  * Use the username `ubuntu` to log into the EC2 instance
