# workflow-frontend: CloudFormation → GuCDK migration

Living plan. Update as reality diverges. Follows the guardian/cdk migration
guide and the internal `cloudformation-to-gucdk-migration` skill (incremental
dual-stack, one PR per phase, each independently deployable and revertible).

## Fixed identifiers (record & reuse exactly)

| Thing | Value |
| --- | --- |
| App | `workflow-frontend` |
| Stack | `workflow` |
| Region | `eu-west-1` |
| Stages | `CODE`, `PROD` |
| CFN stack names | `Workflow-Frontend-CODE`, `Workflow-Frontend-PROD` |
| App port | `9000` |
| Health check | `HTTP:9000/management/healthcheck` |
| Instance type | `t4g.medium` (CODE min1/max2/desired1, PROD min3/max6/desired3) |
| Service domain | `workflow.gutools.co.uk` (PROD), `workflow.code.dev-gutools.co.uk` (CODE) |
| Riff-Raff project (app) | `Editorial Tools::Workflow::Workflow Frontend` (this repo) |
| Riff-Raff project (CFN) | `Editorial Tools::Workflow::Workflow Frontend Cloudformation` (editorial-tools-platform) |

## Current architecture (before migration)

- **This repo (`workflow-frontend`)** builds the Debian package and deploys via
  [conf/riff-raff.yaml](../conf/riff-raff.yaml):
  - `workflow-frontend` (type `autoscaling`)
  - `workflow-frontend-ami-update` (type `ami-cloudformation-parameter`,
    `cloudFormationStackName: Workflow-Frontend`, `prependStackToCloudFormationStackName: false`)
    — only mutates the `AMI` parameter on the existing stack.
- **`editorial-tools-platform`** (separate repo, checked out at
  `/Users/david_furey/code/editorial-tools-platform`) owns and deploys the CFN
  template `cloudformation/workflow-account/workflow/workflow-frontend.yaml`
  via a `cloud-formation` Riff-Raff step (see its `.github/workflows/ci.yml`).

### CFN template inventory (`workflow-frontend.yaml`)

- **Compute:** ASG (`WorkflowFrontendAutoscalingGroupNewVpc`) + LaunchConfiguration
  (`WorkflowFrontendLaunchConfigNewVpc`), `t4g.medium`, port 9000, ELB health check,
  IMDSv2 required, UserData downloads `application.defaults.conf`, `keys.conf`,
  and the `.deb` from S3 then `dpkg -i`.
- **Load balancing:** classic ELB (`AWS::ElasticLoadBalancing::LoadBalancer`,
  `WorkflowFrontendLoadBalancerNewVpc`), 80+443→9000, access logs to `workflow-logs`.
  → migrate to ALB via `GuEc2App`.
- **CloudFront:** `WorkflowFrontendCloudfront` distribution with origin =
  ELB `DNSName`, second ACM cert (`CloudFrontSSLCertificateArn`), aliases per stage.
  **This sits in front of the ELB** — the DNS/traffic switch in Phase 3 is
  "repoint the CloudFront origin from old ELB to new ALB", not an NS1 CNAME.
- **IAM:** `DistributionRole` + inline/attached policies:
  - `root`: `s3:GetObject` on workflow-dist, workflow-private, pan-domain-auth-settings, permissions-cache
  - `PushLogs`: `logs:*`
  - `DescribeEC2Policy`: ec2/autoscaling `Describe*`  → **redundant with GuInstanceRole, drop**
  - `Dynamo`: `dynamodb:*` on `*`
  - `LogServerPolicy`: kinesis Put/Describe on `ELKKinesisStreamArn` → **GuInstanceRole ships logs, review/drop**
  - `GetTeamKeysPolicy`: s3 get/list on `github-team-keys` (SSH team keys)
  - `AssumeCapiPreviewRolePolicy`: `sts:AssumeRole` on `CapiPreviewRole`
  - Managed: `guardian-ec2-for-ssm-GuardianEC2ForSSMPolicy` (ImportValue)
- **Security groups:** `AppServerSecurityGroupNewVpc` (9000 from LB SG),
  `LoadBalancerSecurityGroupNewVpc` (80/443 from world), plus datastore LB access
  SG refs (`/PROD|CODE/workflow/datastore/LoadBalancerAccessSecurityGroupId`).
- **Other:** `WorkflowFrontendGroup` (IAM group; not instance-related — leave in legacy).
- **Parameters:** `Stage`, `SSLCertificateArn`, `CloudFrontSSLCertificateArn`, `AMI`,
  `GithubTeamName`, datastore SG SSM params (PROD/CODE), `CloudFrontAccessLogsBucketName`,
  `CapiPreviewRole`, `ELKKinesisStreamArn`, `ELKKinesisStreamName`, `VpcId`,
  `PublicSubnets`, `PrivateSubnets`.
- **Outputs:** `WorkflowFrontendLoadBalancerDNS`, `WorkflowFrontendCloudfrontDNS`.

## Decisions (confirmed with owner)

1. GuCDK project lives in **this `workflow-frontend` repo**; template moved here
   from editorial-tools-platform.
2. This session: living plan + **Phase 1** only.
3. CFN stack names: `Workflow-Frontend-CODE` / `Workflow-Frontend-PROD`.
4. CloudFront + `workflow.gutools.co.uk` DNS stay as-is for the migration; Phase 3
   repoints the CloudFront origin to the new ALB. **Migrating CloudFront into
   GuCDK is a Phase 5 follow-up.**

## Cross-repo ownership (do before/with Phase 1)

The CFN stack is deployed from `editorial-tools-platform`, not this repo. To avoid
two repos deploying the same stack:

- [x] Remove the `Editorial Tools::Workflow::Workflow Frontend Cloudformation`
      Riff-Raff step from `editorial-tools-platform/.github/workflows/ci.yml` and
      delete the orphaned `cloudformation/workflow-account/workflow/workflow-frontend.yaml`.
      **Its own PR in editorial-tools-platform** — edits staged in that repo's working tree.
- [ ] Check `guardian/riffraff-platform` `access.ts`; remove editorial-tools-platform's
      permission to publish `Editorial Tools::Workflow::Workflow Frontend Cloudformation`.
      **Its own PR.** (not done — needs the riffraff-platform repo)
- [ ] Make the Phase 1 PR in this repo depend on the above and note it in the PR body.

## Phases

### Phase 1 — wrap template with GuCDK (tags-only)  ← IN PROGRESS
Goal: `CDK(cfn.yaml) -> cfn.json` with zero resource changes (tags/metadata only).
- [x] Move template → `cloudformation/workflow-frontend.cfn.yaml` (this repo).
- [x] Scaffold `cdk/` via `@guardian/cdk new` (v64.3.0) pointing at the template.
- [x] `bin/cdk.ts`: define `Workflow-Frontend-euwest-1-CODE` and `-PROD`, each with
      per-stage `cloudFormationStackName` (`Workflow-Frontend-CODE` / `-PROD`).
- [x] Snapshot test covers both CODE + PROD (`region: eu-west-1`). lint/test/synth green.
- [x] `npm run diff` per stage → confirmed. **CODE = tags-only.** **PROD = tags-only
      plus the pending PR #1069 change** (`IsCODE` condition + `RunWorkflowFrontendLocally`
      managed policy) which is inert in PROD (`Condition: IsCODE` → false, nothing created).
      #1069 was deployed to CODE but not PROD upstream; since we removed the
      editorial-tools-platform deploy, our CDK deploy is now the only path that
      brings it to PROD.
- [x] CI: `cdk/` build step (`npm ci` → lint → test → synth) + upload both
      `cdk.out/*.template.json` to Riff-Raff under `cfn-workflow-frontend`.
- [x] Replaced `ami-cloudformation-parameter` with a `cloud-formation` deployment of the
      synthesized templates (targeting `Workflow-Frontend-<stage>`);
      `autoscaling` deployment now `dependencies: [cfn-workflow-frontend]`.
- [ ] PR (depends on cross-repo removal), deploy CODE then PROD.

**Expected `cdk diff` (Phase 1):** additive only — `gu:cdk:version`, `gu:repo`, `Stack`,
`Stage` tags + `gu:cdk:*` metadata. Benign: `Stage` resolving from `{"Ref":"Stage"}`
to the literal, and ASG `PropagateAtLaunch` `"true"` → `true`. If a resource shows as
`[+]`/`[-]` (not just tags), STOP — likely a wrong `cloudFormationStackName`.
Root `.nvmrc` is `22.5.1`, so CI reuses it for the CDK build (no `cdk/.nvmrc` needed).

### Phase 2 — introduce `GuEc2App` (ALB) alongside legacy ELB (dual-stack)
- New ALB infra in parallel; DNS/CloudFront still on the legacy ELB.
- Reuse included template's `VpcId`/`PublicSubnets`/`PrivateSubnets` via
  `cfnInclude.getParameter(...)`; attach datastore SGs (watch 5-SG limit).
- Port only app-specific policies (S3, Dynamo, GetTeamKeys, AssumeCapiPreviewRole,
  kinesis if needed) as `GuAllowPolicy`; drop DescribeEC2/logging (GuInstanceRole).
- Tag new ASG `gu:riffraff:new-asg=true`; `asgMigrationInProgress: true`;
  `amiParametersToTags` with legacy `AMI` + new cdk-base AMI param.

### Phase 3 — switch traffic (revertible)
- Repoint CloudFront origin from legacy ELB `DNSName` to new ALB `DNSName`.
  (No NS1 CNAME here — CloudFront fronts the service.) Lower any TTLs first; soak;
  rollback = repoint origin back.

### Phase 4 — cleanup
- Remove legacy ELB, ASG, LaunchConfiguration, old SGs, old role/policies, old cert
  from the template. Remove `gu:riffraff:new-asg` tag and `asgMigrationInProgress`;
  set `amiParameter` to the new AMI param. Deploy (mostly removals).

### Phase 5 — follow-ups
- Migrate CloudFront distribution into GuCDK.
- Stateful/shared resources per stateful-resources guide (shared buckets/KMS owned
  by other stacks stay put).
- Add CloudWatch alarms the legacy stack lacked.

## Notes / open questions
- Template was **re-synced** from editorial-tools-platform `main` after PR #1069
  ("Add developer policy for workflow frontend") merged — it added the `IsCODE`
  condition and CODE-only `RunWorkflowFrontendLocally` managed policy. The initial
  copy was stale and the first `cdk diff` showed it would DELETE that policy in CODE.
  Keep `cloudformation/workflow-frontend.cfn.yaml` in sync with upstream until the
  editorial-tools-platform copy is deleted (Phase 1 cross-repo PR).
- `.nvmrc` at repo root is `22.5.1` (modern) — no legacy-node gotcha, but the CDK
  build still gets its own node 20+ setup step.
- Confirm exact live stack names before first `cdk diff` (owner: `Workflow-Frontend-CODE/-PROD`).
- Need AWS profile from owner to run `cdk diff` against live stacks each phase.
