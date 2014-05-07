Workflow
========

AKA *Taxi*, *Kraken*

Development prerequisites
-------------------------

  * Install [SBT](http://www.scala-sbt.org/)
  * Get an account in the [aws-cms-workflow](https://aws-cms-workflow.signin.aws.amazon.com/console) AWS account
  * Create your own CloudFormation stack, using the developer template in `cloudformation/dev-template.json`
  * Query the stack outputs (can be found in the Outputs tab for your stack in the AWS Console), and copy the values
    into `conf/local.conf` [TODO: make a template for local.conf with placeholders]

Running the application
-----------------------

This is a Play! application, so you can run it thus:

    $ sbt
    $ run [optional port number - default 9000]

This will run the application in development mode, so it automatically recompiles any changes when you make a request.
