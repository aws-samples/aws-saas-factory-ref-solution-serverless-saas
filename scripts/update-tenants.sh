#!/bin/bash -xe

# todo: consider setting these env-vars in CDK
export CDK_PARAM_CONTROL_PLANE_SOURCE='sbt-control-plane-api'
export CDK_PARAM_ONBOARDING_DETAIL_TYPE='Onboarding'
export CDK_PARAM_PROVISIONING_DETAIL_TYPE=$CDK_PARAM_ONBOARDING_DETAIL_TYPE
export CDK_PARAM_APPLICATION_NAME_PLANE_SOURCE="sbt-application-plane-api"
export CDK_PARAM_OFFBOARDING_DETAIL_TYPE='Offboarding'
export CDK_PARAM_DEPROVISIONING_DETAIL_TYPE=$CDK_PARAM_OFFBOARDING_DETAIL_TYPE
export CDK_PARAM_PROVISIONING_EVENT_SOURCE="sbt-application-plane-api"

cd server/
npm install

# Define the DynamoDB table name and initial parameters
page_size=10
query_parameters=""

while true; do
  scan_result=$(aws dynamodb scan --table-name $tenantMappingTableName --max-items $page_size $query_parameters)

  items=$(echo $scan_result | jq '.Items')

  for item in $(echo "$items" | jq -c '.[]'); do
    echo "Item:"
    echo "$item" | jq .
    COMMIT_ID=$(echo "$item" | jq -r '.codeCommitId.S')

    if [ "$COMMIT_ID" == "$CDK_PARAM_COMMIT_ID" ]; then
      echo "already updated"
    else
      STACK_NAME=$(echo "$item" | jq -r '.stackName.S')
      export CDK_PARAM_TENANT_ID=$(echo "$item" | jq -r '.tenantId.S')
      npx cdk deploy $STACK_NAME --require-approval never
    fi

  done

  next_token=$(echo $scan_result | jq -r '.NextToken')

  if [ "$next_token" == "null" ]; then
    break
  fi

  query_parameters="--starting-token $next_token"
done
