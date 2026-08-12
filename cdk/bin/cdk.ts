import "source-map-support/register";
import { GuRoot } from "@guardian/cdk/lib/constructs/root";
import { WorkflowFrontend } from "../lib/workflow-frontend";

const app = new GuRoot();

new WorkflowFrontend(app, "Workflow-Frontend-euwest-1-CODE", {
  stack: "workflow",
  stage: "CODE",
  env: { region: "eu-west-1" },
  // Match the real, deployed CloudFormation stack name so `cdk diff` compares
  // against the live stack rather than reporting every resource as new.
  cloudFormationStackName: "Workflow-Frontend-CODE",
});

new WorkflowFrontend(app, "Workflow-Frontend-euwest-1-PROD", {
  stack: "workflow",
  stage: "PROD",
  env: { region: "eu-west-1" },
  cloudFormationStackName: "Workflow-Frontend-PROD",
});
