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

	* Copy `prototype/conf/application.local-example.conf` to `prototype/conf/application.local.conf`
  * Copy `prole/conf/application.local-example.conf` to `prole/conf/application.local.conf`
  * Deploy your cloud-formation script on AWS and query the stack outputs (can be found in the Outputs tab for your stack in the AWS Console), and copy the values
    into `prototype/conf/application.local.conf` and `prole/conf/application.local.conf`
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

  * In ~/.bash_profile add
    export AWS_ACCESS_KEY=<access-key-id>

    export AWS_SECRET_KEY=<secret-key>


Running the application
-----------------------

### Nginx

To run correctly in standalone mode we run behind nginx, This can be installed as follows (you may have done
this already if you work with composer, identity, r2 or similar):

1. Install nginx:
  * *Linux:*   ```sudo apt-get install nginx```
  * *Mac OSX:* ```brew install nginx```

2. Make sure you have a sites-enabled folder under your nginx home. This should be
  * *Linux:* ```/etc/nginx/sites-enabled```
  * *Mac OSX:* ```/usr/local/etc/nginx/```

3. Make sure your nginx.conf (found in your nginx home) contains the following line in the http{} block:
`include sites-enabled/*;`
  * you may also want to disable the default server on 8080

4. Get the [dev-nginx](https://github.com/guardian/dev-nginx) repo checked out on your machine

5. Set up certs if you've not already done so (see dev-nginx readme)
 
6. Configure the workflow route in nginx

    sudo <path_of_dev-nginx>/setup-app.rb <path_of_workflowt>/nginx/nginx-mapping.yml



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

Integration Tests
-------------

Integration tests for Workflow which are written in JavaScript using Protractor and Jasmine. Currently these can only be run locally, but will eventually run as part of the build process

Install protractor on your machine - this also bundles Selenium webdriver

    $ npm install -g protractor

Install or update Selenium webdriver to the newest version

    $ webdriver-manager update

Start the Selenium server

    $ webdriver-manager start

Run the tests

    export TESTUSER_USERNAME=<username>
    export TESTUSER_PASSWORD=<password>
    $ protractor ~/test/conf.js

Run the tests through saucelabs

    export SAUCE_USERNAME=<username>
    export SAUCE_ACCESS_KEY=<access_key>
    $ node ~/test/sauce-connect+run.js

Updating AMIs
-------------

We use [packer](https://packer.io/) to create new AMIs, you can download it here: http://www.packer.io/downloads.html.
To create an AMI, you must set AWS_ACCESS_KEY and AWS_SECRET_KEY as described above.
The prototype app also requires a set of keys. Download them from the private s3 bucket

 ```
      aws s3 cp s3://workflow-private/packer-ami-key.pem /etc/gu/packer-ami-key.pem
      ```
  ```
       aws s3 cp s3://workflow-private/packer-ami-certificate.pem /etc/gu/packer-ami-certificate.pem
       ```

###Building
To add your requirements to the new AMI, you should update provisioning.json. This will probably involve editing the
provisioners section, but more information can be found in the packer docs. Once you are ready, run the following:
You should get the latest ubuntu ami image from [https://cloud-images.ubuntu.com/trusty/current/]
Prole needs a 64 bit ebs instance eu-west-1 region
Prototype needs a 64 instance-storage eu-west-1 region

``` packer build prototype/provisioning.json
   ```
``` packer build prole/provisioning.json
```

This will take several minutes to build the new AMI. Once complete, you should see something like:

```eu-west-1: ami-xxxxxxxx
```
You can then add the ami instance to cloud formation.