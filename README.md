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
  * Query the stack outputs (can be found in the Outputs tab for your stack in the AWS Console), and copy the values
    into `conf/local.conf` using the following template:
  * Google OAuth2 credentials can be found at https://console.developers.google.com/project/apps~gu-workflow
  * Download our private keys from the `workflow-private` S3 bucket. You will need an AWS account so ask another dev.

      If you have the AWS CLI set up you can run
      ```
      aws s3 cp s3://workflow-private/keys.conf /etc/gu/workflow-keys.conf
      ```

        aws {
          key = "{AwsId}"
          secret = "{AwsSecret}"
          flex.notifications.queue = "{SqsQueueUrl}"
        }
        db {
          default {
            url="jdbc:postgresql://{DatabaseHost}:5432/workflow"
            user=???
            password=???
          }
        }
	    google {
    	  clientId=???
          clientSecret=??? 
        }
        # Uncomment the line below if you want to see SQL queries in the log
        # logger.scala.slick.jdbc.JdbcBackend.statement=DEBUG


Running the application
-----------------------

This is a Play! application, so you can run it thus:

    $ sbt
    $ run [optional port number - default 9000]

This will run the application in development mode, so it automatically recompiles any changes when you make a request.

Debugging in the cloud
----------------------

If you want to SSH to one of the EC2 instances:

  * Obtain a copy of the `workflow-developers` private key
  * Add it to your ssh agent using `ssh-add workflow-developers.pem`
  * Use the username `ubuntu` to log into the EC2 instance
