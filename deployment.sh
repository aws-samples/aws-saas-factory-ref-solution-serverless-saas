#!/bin/bash -x
#Create CodeCommit repo
REGION=$(aws configure get region)
aws codecommit get-repository --repository-name aws-saas-factory-ref-serverless-saas
if [[ $? -ne 0 ]]; then
     echo "aws-saas-factory-ref-serverless-saas codecommit repo is not present, will create one now"
     CREATE_REPO=$(aws codecommit create-repository --repository-name aws-saas-factory-ref-serverless-saas --repository-description "Serverless saas reference architecture repository")
     echo $CREATE_REPO
     REPO_URL="codecommit::${REGION}://aws-saas-factory-ref-serverless-saas"
     git remote add cc $REPO_URL
     if [[ $? -ne 0 ]]; then
         echo "Setting url to remote cc"
         git remote set-url cc $REPO_URL
     fi    
     git push --set-upstream cc main
fi

#Deploying CI/CD pipeline
cd server/TenantPipeline/
npm install && npm run build 
cdk bootstrap  
cdk deploy 

if [[ $? -ne 0 ]]; then
    exit 1
fi

# Deploying bootstrap
cd ../

DEFAULT_SAM_S3_BUCKET=$(grep s3_bucket samconfig-bootstrap.toml|cut -d'=' -f2 | cut -d \" -f2)
echo "aws s3 ls s3://$DEFAULT_SAM_S3_BUCKET"
aws s3 ls s3://$DEFAULT_SAM_S3_BUCKET
if [ $? -ne 0 ]; then
    echo "S3 Bucket: $DEFAULT_SAM_S3_BUCKET specified in samconfig-bootstrap.toml is not readable.
    So creating a new S3 bucket and will update samconfig-bootstrap.toml with new bucket name."
    
    UUID=$(uuidgen | awk '{print tolower($0)}')
    SAM_S3_BUCKET=sam-bootstrap-bucket-$UUID
    aws s3 mb s3://$SAM_S3_BUCKET --region $REGION
    if [[ $? -ne 0 ]]; then
      exit 1
    fi
    # Updating samconfig-bootstrap.toml with new bucket name
    ex -sc '%s/s3_bucket = .*/s3_bucket = \"'$SAM_S3_BUCKET'\"/|x' samconfig-bootstrap.toml
fi

sam build -t bootstrap-template.yaml --use-container --region=$REGION
sam deploy --config-file samconfig-bootstrap.toml --region=$REGION --parameter-overrides AdminEmailParameter=$1 

if [[ $? -ne 0 ]]; then
    exit 1
fi

# Start CI/CD pipepline which loads tenant stack
aws codepipeline start-pipeline-execution --name serverless-saas-pipeline 


ADMIN_SITE_BUCKET=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminAppBucket'].Value" --output text )
APP_SITE_BUCKET=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AppBucket'].Value" --output text )
LANDING_APP_SITE_BUCKET=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-LandingAppBucket'].Value" --output text )

ADMIN_SITE_URL=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminAppSite'].Value" --output text )
APP_SITE_URL=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-ApplicationSite'].Value" --output text )
LANDING_APP_SITE_URL=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-LandingApplicationSite'].Value" --output text )

ADMIN_APPCLIENTID=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminUserPoolClientId'].Value" --output text )
ADMIN_AUTHSERVERURL=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminUserPoolProviderURL'].Value" --output text )
ADMIN_APIGATEWAYURL=$(aws cloudformation list-exports --query "Exports[?Name=='Serverless-SaaS-AdminApiGatewayUrl'].Value" --output text )

# Configuring admin UI 
echo "aws s3 ls s3://$ADMIN_SITE_BUCKET"
aws s3 ls s3://$ADMIN_SITE_BUCKET 
if [ $? -ne 0 ]; then
    echo "Error! S3 Bucket: $ADMIN_SITE_BUCKET not readable"
    exit 1
fi

cd ../

CURRENT_DIR=$(pwd)
echo "Current Dir: $CURRENT_DIR"

cd clients/Admin

echo "Configuring environment for Admin Client"

cat << EoF > ./src/environments/environment.prod.ts
export const environment = {
  production: true,
  clientId: '$ADMIN_APPCLIENTID',
  issuer: '$ADMIN_AUTHSERVERURL',
  apiGatewayUrl: '$ADMIN_APIGATEWAYURL',
  domain: ''
};
EoF
cat << EoF > ./src/environments/environment.ts
export const environment = {
  production: true,
  clientId: '$ADMIN_APPCLIENTID',
  issuer: '$ADMIN_AUTHSERVERURL',
  apiGatewayUrl: '$ADMIN_APIGATEWAYURL',
  domain: ''
};
EoF

npm install --legacy-peer-deps && npm run build

echo "aws s3 sync --delete --cache-control no-store dist s3://$ADMIN_SITE_BUCKET"
aws s3 sync --delete --cache-control no-store dist s3://$ADMIN_SITE_BUCKET 

if [[ $? -ne 0 ]]; then
    exit 1
fi

echo "Completed configuring environment for Admin Client"

# Configuring application UI 

echo "aws s3 ls s3://$APP_SITE_BUCKET"
aws s3 ls s3://$APP_SITE_BUCKET 
if [ $? -ne 0 ]; then
    echo "Error! S3 Bucket: $APP_SITE_BUCKET not readable"
    exit 1
fi

cd ../

CURRENT_DIR=$(pwd)
echo "Current Dir: $CURRENT_DIR"

cd Application

echo "Configuring environment for App Client"

cat << EoF > ./src/environments/environment.prod.ts
export const environment = {
  production: true,
  regApiGatewayUrl: '$ADMIN_APIGATEWAYURL',
  domain: ''
};
EoF
cat << EoF > ./src/environments/environment.ts
export const environment = {
  production: true,
  regApiGatewayUrl: '$ADMIN_APIGATEWAYURL',
  domain: ''
};
EoF

npm install --legacy-peer-deps && npm run build

echo "aws s3 sync --delete --cache-control no-store dist s3://$APP_SITE_BUCKET"
aws s3 sync --delete --cache-control no-store dist s3://$APP_SITE_BUCKET 

if [[ $? -ne 0 ]]; then
    exit 1
fi

echo "Completed configuring environment for App Client"

# Configuring landing UI 

echo "aws s3 ls s3://$LANDING_APP_SITE_BUCKET"
aws s3 ls s3://$LANDING_APP_SITE_BUCKET 
if [ $? -ne 0 ]; then
    echo "Error! S3 Bucket: $LANDING_APP_SITE_BUCKET not readable"
    exit 1
fi

cd ../

CURRENT_DIR=$(pwd)
echo "Current Dir: $CURRENT_DIR"

cd Landing

echo "Configuring environment for Landing Client"

cat << EoF > ./src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiGatewayUrl: '$ADMIN_APIGATEWAYURL'
};
EoF
cat << EoF > ./src/environments/environment.ts
export const environment = {
  production: true,
  apiGatewayUrl: '$ADMIN_APIGATEWAYURL'
};
EoF

npm install --legacy-peer-deps && npm run build

echo "aws s3 sync --delete --cache-control no-store dist s3://$LANDING_APP_SITE_BUCKET"
aws s3 sync --delete --cache-control no-store dist s3://$LANDING_APP_SITE_BUCKET

if [[ $? -ne 0 ]]; then
    exit 1
fi

cd ../..

echo "Completed configuring environment for Landing Client"


echo "Admin site URL: https://$ADMIN_SITE_URL"
echo "Application site URL: https://$APP_SITE_URL"
echo "Landing site URL: https://$LANDING_APP_SITE_URL"
echo "Successfully completed deployment"






