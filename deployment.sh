#!/bin/bash -e

# Create CodeCommit repo
REGION=$(aws configure get region)
if ! aws codecommit get-repository --repository-name aws-saas-factory-ref-serverless-saas; then
  echo "aws-saas-factory-ref-serverless-saas codecommit repo is not present, will create one now"
  CREATE_REPO=$(aws codecommit create-repository --repository-name aws-saas-factory-ref-serverless-saas --repository-description "Serverless saas reference architecture repository")
  echo "$CREATE_REPO"
fi

REPO_URL="codecommit::${REGION}://aws-saas-factory-ref-serverless-saas"
if ! git remote add cc "$REPO_URL"; then
  echo "Setting url to remote cc"
  git remote set-url cc "$REPO_URL"
fi
git push cc "$(git branch --show-current)":main
# git push --set-upstream cc main

# enable yarn
corepack enable || npm install --global yarn

# Deploying CI/CD pipeline
cd server/TenantPipeline/ || exit # stop execution if cd fails
yarn install && yarn build
# npm install && npm run build
cdk bootstrap

if ! cdk deploy; then
  exit 1
fi

# Deploying bootstrap
cd ../

DEFAULT_SAM_S3_BUCKET=$(grep s3_bucket samconfig-bootstrap.toml | cut -d'=' -f2 | cut -d \" -f2)
echo "aws s3 ls s3://${DEFAULT_SAM_S3_BUCKET}"
if ! aws s3 ls "s3://${DEFAULT_SAM_S3_BUCKET}"; then
  echo "S3 Bucket: $DEFAULT_SAM_S3_BUCKET specified in samconfig-bootstrap.toml is not readable.
    So creating a new S3 bucket and will update samconfig-bootstrap.toml with new bucket name."

  UUID=$(uuidgen | awk '{print tolower($0)}')
  SAM_S3_BUCKET=sam-bootstrap-bucket-$UUID
  aws s3 mb "s3://${SAM_S3_BUCKET}" --region "$REGION"
  aws s3api put-bucket-encryption \
    --bucket "$SAM_S3_BUCKET" \
    --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
  if [[ $? -ne 0 ]]; then
    exit 1
  fi
  # Updating samconfig-bootstrap.toml with new bucket name
  ex -sc '%s/s3_bucket = .*/s3_bucket = \"'"$SAM_S3_BUCKET"'\"/|x' samconfig-bootstrap.toml
fi

sam build -t bootstrap-template.yaml --use-container --region="$REGION"
sam deploy --config-file samconfig-bootstrap.toml --region="$REGION" --parameter-overrides AdminEmailParameter="$1"

if [[ $? -ne 0 ]]; then
  exit 1
fi

# Start CI/CD pipepline which loads tenant stack
aws codepipeline start-pipeline-execution --name serverless-saas-pipeline

ADMIN_SITE_BUCKET=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminAppBucket'].Value" --output text)
APP_SITE_BUCKET=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AppBucket'].Value" --output text)
LANDING_APP_SITE_BUCKET=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-LandingAppBucket'].Value" --output text)

ADMIN_SITE_URL=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminAppSite'].Value" --output text)
APP_SITE_URL=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-ApplicationSite'].Value" --output text)
LANDING_APP_SITE_URL=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-LandingApplicationSite'].Value" --output text)

ADMIN_APPCLIENTID=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminUserPoolClientId'].Value" --output text)
ADMIN_USERPOOLID=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminUserPoolId'].Value" --output text)
ADMIN_APIGATEWAYURL=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminApiGatewayUrl'].Value" --output text)

# Configuring admin UI
echo "aws s3 ls s3://${ADMIN_SITE_BUCKET}"
if ! aws s3 ls "s3://${ADMIN_SITE_BUCKET}"; then
  echo "Error! S3 Bucket: $ADMIN_SITE_BUCKET not readable"
  exit 1
fi

cd ../

CURRENT_DIR=$(pwd)
echo "Current Dir: $CURRENT_DIR"

cd clients/Admin || exit # stop execution if cd fails

echo "Configuring environment for Admin Client"
cat <<EoF >./src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '$ADMIN_APIGATEWAYURL',
};

EoF
cat <<EoF >./src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: '$ADMIN_APIGATEWAYURL',
};
EoF

cat <<EoF >./src/aws-exports.ts
const awsmobile = {
    "aws_project_region": "$REGION",
    "aws_cognito_region": "$REGION",
    "aws_user_pools_id": "$ADMIN_USERPOOLID",
    "aws_user_pools_web_client_id": "$ADMIN_APPCLIENTID",
};

export default awsmobile;
EoF

yarn install && yarn build
# npm install --legacy-peer-deps && npm run build

echo "aws s3 sync --delete --cache-control no-store dist s3://${ADMIN_SITE_BUCKET}"
aws s3 sync --delete --cache-control no-store dist "s3://${ADMIN_SITE_BUCKET}"

if [[ $? -ne 0 ]]; then
  exit 1
fi

echo "Completed configuring environment for Admin Client"

# Configuring application UI
echo "aws s3 ls s3://${APP_SITE_BUCKET}"
if ! aws s3 ls "s3://${APP_SITE_BUCKET}"; then
  echo "Error! S3 Bucket: $APP_SITE_BUCKET not readable"
  exit 1
fi

cd ../

CURRENT_DIR=$(pwd)
echo "Current Dir: $CURRENT_DIR"

cd Application || exit # stop execution if cd fails

echo "Configuring environment for App Client"

cat <<EoF >./src/environments/environment.prod.ts
export const environment = {
  production: true,
  regApiGatewayUrl: '$ADMIN_APIGATEWAYURL',
};
EoF

cat <<EoF >./src/environments/environment.ts
export const environment = {
  production: true,
  regApiGatewayUrl: '$ADMIN_APIGATEWAYURL',
};
EoF

yarn install && yarn build
# npm install --legacy-peer-deps && npm run build

echo "aws s3 sync --delete --cache-control no-store dist s3://${APP_SITE_BUCKET}"
aws s3 sync --delete --cache-control no-store dist "s3://${APP_SITE_BUCKET}"

if [[ $? -ne 0 ]]; then
  exit 1
fi

echo "Completed configuring environment for App Client"

# Configuring landing UI

echo "aws s3 ls s3://${LANDING_APP_SITE_BUCKET}"
if ! aws s3 ls "s3://${LANDING_APP_SITE_BUCKET}"; then
  echo "Error! S3 Bucket: $LANDING_APP_SITE_BUCKET not readable"
  exit 1
fi

cd ../

CURRENT_DIR=$(pwd)
echo "Current Dir: $CURRENT_DIR"

cd Landing || exit # stop execution if cd fails

echo "Configuring environment for Landing Client"

cat <<EoF >./src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiGatewayUrl: '$ADMIN_APIGATEWAYURL'
};
EoF

cat <<EoF >./src/environments/environment.ts
export const environment = {
  production: false,
  apiGatewayUrl: '$ADMIN_APIGATEWAYURL'
};
EoF

yarn install && yarn build
# npm install --legacy-peer-deps && npm run build

echo "aws s3 sync --delete --cache-control no-store dist s3://${LANDING_APP_SITE_BUCKET}"
aws s3 sync --delete --cache-control no-store dist "s3://${LANDING_APP_SITE_BUCKET}"

if [[ $? -ne 0 ]]; then
  exit 1
fi

cd ../..

echo "Completed configuring environment for Landing Client"

echo "Admin site URL: https://$ADMIN_SITE_URL"
echo "Application site URL: https://$APP_SITE_URL"
echo "Landing site URL: https://$LANDING_APP_SITE_URL"
echo "Successfully completed deployment"
