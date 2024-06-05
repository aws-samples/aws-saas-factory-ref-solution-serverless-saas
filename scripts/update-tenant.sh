#!/bin/bash -xe

# todo: consider setting these env-vars in CDK
export CDK_PARAM_CONTROL_PLANE_SOURCE='sbt-control-plane-api'
export CDK_PARAM_ONBOARDING_DETAIL_TYPE='Onboarding'
export CDK_PARAM_PROVISIONING_DETAIL_TYPE=$CDK_PARAM_ONBOARDING_DETAIL_TYPE
export CDK_PARAM_APPLICATION_NAME_PLANE_SOURCE="sbt-application-plane-api"
export CDK_PARAM_OFFBOARDING_DETAIL_TYPE='Offboarding'
export CDK_PARAM_DEPROVISIONING_DETAIL_TYPE=$CDK_PARAM_OFFBOARDING_DETAIL_TYPE
export CDK_PARAM_PROVISIONING_EVENT_SOURCE="sbt-application-plane-api"
export CDK_PARAM_CODE_COMMIT_REPOSITORY_NAME="aws-saas-factory-ref-solution-serverless-saas"
#export CDK_PARAM_SYSTEM_ADMIN_EMAIL="$EMAIL",
export CDK_PARAM_SYSTEM_ADMIN_EMAIL="",
export CDK_PARAM_CODE_COMMIT_REPOSITORY_NAME="aws-saas-factory-ref-solution-serverless-saas",
echo "$CDK_PARAM_SYSTEM_ADMIN_EMAIL"

# TODO pass in.
export CDK_PARAM_COMMIT_ID=''

cd server/
npm install

npx cdk deploy $STACK_NAME --require-approval never
