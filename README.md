# Serverless SaaS - Reference Solution

This serverless saas reference solution is built using [SaaS Builder Toolkit (SBT)](https://github.com/awslabs/sbt-aws) control plane and core application plane components.

We have also created a workshop that you can use as a reference to understand this reference solution in a step-by-step fashion. Workshop is available [here](https://github.com/aws-samples/aws-serverless-saas-workshop).

**[Feedback & Feature request](https://www.pulse.aws/survey/EHE3TICQ)** | **[Documentation](DOCUMENTATION.md)**

## Before you build on this

This is a reference solution. It is published so you can adapt its patterns into
your own multi-tenant SaaS application, and we expect derived code to run in
production. That is the point of it. It is not, however, a finished product, and
it is not a substitute for your own security review.

Read this before you deploy or fork:

- **Review it against your own requirements.** The tenant isolation model here —
  a Lambda authorizer that vends a per-tenant scoped credential — is a pattern to
  learn from and adapt. Do not assume it fits your threat model unchanged.
- **You own the security of what you deploy.** Once you fork or adapt this code,
  its security posture in your account is yours. Apply your own review, testing,
  and monitoring before it handles real tenant data.
- **Track upstream fixes.** Security fixes do land here. If you have forked this
  repository, diff against the current `main` before deploying and pull
  corrected code.

### Security

Tenant isolation and authorization hardening landed in this repository in
September 2026. If you forked before then, pull the current `main`.

One finding from that work is worth checking in your own deployment even if you
never used this code: audit the `WriteAttributes` list on your Cognito app
client. Any attribute a signed-in user can write to their own account can be
changed by calling Cognito directly with their access token, which bypasses your
API and any authorization you enforce there. Custom attributes that drive
authorization decisions — a role, a tenant id — must not be self-writable.

To report a security issue, please follow the
[AWS Vulnerability Reporting Program](https://aws.amazon.com/security/vulnerability-reporting/)
rather than opening a public issue.

## Pre-requisites

- This reference architecture uses Python. Make sure you have Python 3.9 or above installed.
- Make sure you have [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) installed.
- Make sure you have the latest version of [AWS CDK CLI](https://docs.aws.amazon.com/cdk/latest/guide/cli.html) installed. Not having the release version of CDK can cause deployment issues.
- Make sure that you have Node 18 or above.
- Make sure that you have docker cli installed and docker daemon running.

## Deploying

To deploy this reference solution run below script. Replace the "test@example.com" email address with yours. This email address will be used to setup an admin user in the control plane of this reference solution.

```bash
cd scripts
./install.sh test@example.com
```

This script will deploy the following:

- Creates a Amazon S3 bucket in your AWS account and pushes this reference solutions code to the bucket
- Clones SaaS Builder Toolkit(SBT) control plane repo and installs control plane which has all shared services and control plane UI.
- Deploys cdk stack `serverless-saas-ref-arch-bootstrap-stack` which provisions
  - SaaS Builder Toolkit(SBT) core application plane component which provides infrastructure to provision/de-provision a tenant
  - Infrastructure to host a saas application UI and also deploys this saas application UI.
- Deploys pooled tenant cdk stack `serverless-saas-ref-arch-tenant-template-pooled`, which deploys cognito userpool and multi-tenant order & product services.
- Deploys cdk stack `ServerlessSaaSPipeline` which provisions Tenant Pipeline.This pipeline uses CodePipeline and is responsible for auto updating the stack for all the tenants in an automated fashion.

## Running the tests

The Python unit tests cover the tenant isolation and authorization rules, and run
entirely locally against an in-memory Cognito, so no AWS account is needed:

```bash
pip install -r server/tests/requirements-test.txt
python -m pytest server/tests
```

The CDK assertions run with Jest:

```bash
cd server/cdk
npm install
npm test
```

## Steps to Clean-up

Run below script to clean up

```bash
cd scripts
./cleanup.sh
```
