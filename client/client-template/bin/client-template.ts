#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClientTemplateStack } from '../lib/client-template-stack';

if (!process.env.CDK_PARAM_REG_API_GATEWAY_URL) {
  throw new Error("Please provide control plane api gateway url");
}

if (!process.env.CDK_COGNITO_ADMIN_USER_POOL_ID) {
  throw new Error("Please provide Cognito user pool Id");
}

if (!process.env.CDK_COGNITO_ADMIN_CLIENT_ID) {
  throw new Error("Please provide Cognito admin client Id");
}

if (!process.env.REGION) {
  throw new Error("Please provide a region");
}

const app = new cdk.App();
new ClientTemplateStack(app, 'ClientTemplateStack', {
  apiUrl: process.env.CDK_PARAM_REG_API_GATEWAY_URL,
  userPoolId: process.env.CDK_COGNITO_ADMIN_USER_POOL_ID,
  appClientId: process.env.CDK_COGNITO_ADMIN_CLIENT_ID,
  region: process.env.REGION
});