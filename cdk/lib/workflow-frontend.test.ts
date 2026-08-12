import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { WorkflowFrontend } from "./workflow-frontend";

describe("The WorkflowFrontend stack", () => {
  it.each(["CODE", "PROD"] as const)("matches the %s snapshot", (stage) => {
    const app = new App();
    const stack = new WorkflowFrontend(app, `WorkflowFrontend-${stage}`, {
      stack: "workflow",
      stage,
      env: { region: "eu-west-1" },
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
