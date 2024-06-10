#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TenantTemplateStack } from '../lib/tenant-template/tenant-template-stack';
import { DestroyPolicySetter } from '../lib/cdk-aspect/destroy-policy-setter';
import { BootstrapTemplateStack } from '../lib/bootstrap-template/bootstrap-template-stack';
import { ServerlessSaaSPipeline } from '../lib/tenant-pipeline/serverless-saas-pipeline-sfn';
import { getEnv } from '../lib/helper-functions';
import { ControlPlaneStack } from '../lib/control-plane-stack';

const app = new cdk.App();

// required input parameters
if (!process.env.CDK_PARAM_SYSTEM_ADMIN_EMAIL) {
  throw new Error('Please provide system admin email');
}

if (!process.env.CDK_PARAM_TENANT_ID) {
  console.log('Tenant ID is empty, a default tenant id "pooled" will be assigned');
}
const pooledId = 'pooled';

const systemAdminEmail = process.env.CDK_PARAM_SYSTEM_ADMIN_EMAIL;
const tenantId = process.env.CDK_PARAM_TENANT_ID || pooledId;
const codeCommitRepositoryName = getEnv('CDK_PARAM_CODE_COMMIT_REPOSITORY_NAME');
const controlPlaneSource = getEnv('CDK_PARAM_CONTROL_PLANE_SOURCE');
const onboardingDetailType = getEnv('CDK_PARAM_ONBOARDING_DETAIL_TYPE');
const offboardingDetailType = getEnv('CDK_PARAM_OFFBOARDING_DETAIL_TYPE');
const provisioningDetailType = getEnv('CDK_PARAM_PROVISIONING_DETAIL_TYPE');
const deprovisioningDetailType = getEnv('CDK_PARAM_DEPROVISIONING_DETAIL_TYPE');
const applicationNamePlaneSource = getEnv('CDK_PARAM_APPLICATION_NAME_PLANE_SOURCE');
const commitId = getEnv('CDK_PARAM_COMMIT_ID');

if (!process.env.CDK_PARAM_IDP_NAME) {
  process.env.CDK_PARAM_IDP_NAME = 'COGNITO';
}
if (!process.env.CDK_PARAM_SYSTEM_ADMIN_ROLE_NAME) {
  process.env.CDK_PARAM_SYSTEM_ADMIN_ROLE_NAME = 'SystemAdmin';
}

// default values for optional input parameters
const defaultStageName = 'prod';
const defaultLambdaReserveConcurrency = '1';
const defaultLambdaCanaryDeploymentPreference = 'True';
const defaultApiKeyPlatinumTierParameter = '88b43c36-802e-11eb-af35-38f9d35b2c15-test2';
const defaultApiKeyPremiumTierParameter = '6db2bdc2-6d96-11eb-a56f-38f9d33cfd0f-test2';
const defaultApiKeyStandardTierParameter = 'b1c735d8-6d96-11eb-a28b-38f9d33cfd0f-test2';
const defaultApiKeyBasicTierParameter = 'daae9784-6d96-11eb-a28b-38f9d33cfd0f-test2';
const defaultIdpName = 'COGNITO';
const defaultSystemAdminRoleName = 'SystemAdmin';

// optional input parameters
const idpName = process.env.CDK_PARAM_IDP_NAME || defaultIdpName;
const systemAdminRoleName =
  process.env.CDK_PARAM_SYSTEM_ADMIN_ROLE_NAME || defaultSystemAdminRoleName;
const stageName = process.env.CDK_PARAM_STAGE_NAME || defaultStageName;
const lambdaReserveConcurrency = Number(
  process.env.CDK_PARAM_LAMBDA_RESERVE_CONCURRENCY || defaultLambdaReserveConcurrency
);
const lambdaCanaryDeploymentPreference =
  process.env.CDK_PARAM_LAMBDA_CANARY_DEPLOYMENT_PREFERENCE ||
  defaultLambdaCanaryDeploymentPreference;
const apiKeyPlatinumTierParameter =
  process.env.CDK_PARAM_API_KEY_PLATINUM_TIER_PARAMETER || defaultApiKeyPlatinumTierParameter;
const apiKeyPremiumTierParameter =
  process.env.CDK_PARAM_API_KEY_PREMIUM_TIER_PARAMETER || defaultApiKeyPremiumTierParameter;
const apiKeyStandardTierParameter =
  process.env.CDK_PARAM_API_KEY_STANDARD_TIER_PARAMETER || defaultApiKeyStandardTierParameter;
const apiKeyBasicTierParameter =
  process.env.CDK_PARAM_API_KEY_BASIC_TIER_PARAMETER || defaultApiKeyBasicTierParameter;
const isPooledDeploy = tenantId == pooledId;

// parameter names to facilitate sharing api keys
// between the bootstrap template and the tenant template stack(s)
const apiKeySSMParameterNames = {
  basic: {
    keyId: 'apiKeyBasicTierKeyId',
    value: 'apiKeyBasicTierValue',
  },
  standard: {
    keyId: 'apiKeyStandardTierKeyId',
    value: 'apiKeyStandardTierValue',
  },
  premium: {
    keyId: 'apiKeyPremiumTierKeyId',
    value: 'apiKeyPremiumTierValue',
  },
  platinum: {
    keyId: 'apiKeyPlatinumTierKeyId',
    value: 'apiKeyPlatinumTierValue',
  },
};

const controlPlaneStack = new ControlPlaneStack(app, 'ControlPlaneStack', {
  idpName: idpName,
  systemAdminEmail: systemAdminEmail,
  systemAdminRoleName: systemAdminRoleName,
  controlPlaneSource: controlPlaneSource,
  onboardingDetailType: onboardingDetailType,
  provisioningDetailType: provisioningDetailType,
  applicationNamePlaneSource: applicationNamePlaneSource,
  offboardingDetailType: offboardingDetailType,
});

const bootstrapTemplateStack = new BootstrapTemplateStack(
  app,
  'serverless-saas-ref-arch-bootstrap-stack',
  {
    systemAdminEmail: systemAdminEmail,
    eventBusArn: controlPlaneStack.eventBusArn,
    apiKeyPlatinumTierParameter: apiKeyPlatinumTierParameter,
    apiKeyPremiumTierParameter: apiKeyPremiumTierParameter,
    apiKeyStandardTierParameter: apiKeyStandardTierParameter,
    apiKeyBasicTierParameter: apiKeyBasicTierParameter,
    ApiKeySSMParameterNames: apiKeySSMParameterNames,
    controlPlaneSource: controlPlaneSource,
    onboardingDetailType: onboardingDetailType,
    provisioningDetailType: provisioningDetailType,
    applicationNamePlaneSource: applicationNamePlaneSource,
    offboardingDetailType: offboardingDetailType,
    deprovisioningDetailType: deprovisioningDetailType,
  }
);
cdk.Aspects.of(bootstrapTemplateStack).add(new DestroyPolicySetter());

const tenantTemplateStack = new TenantTemplateStack(
  app,
  `serverless-saas-ref-arch-tenant-template-${tenantId}`,
  {
    tenantId: tenantId,
    stageName: stageName,
    lambdaReserveConcurrency: lambdaReserveConcurrency,
    lambdaCanaryDeploymentPreference: lambdaCanaryDeploymentPreference,
    isPooledDeploy: isPooledDeploy,
    ApiKeySSMParameterNames: apiKeySSMParameterNames,
    tenantMappingTable: bootstrapTemplateStack.tenantMappingTable,
    commitId: commitId,
  }
);

tenantTemplateStack.addDependency(bootstrapTemplateStack);
cdk.Tags.of(tenantTemplateStack).add('TenantId', tenantId);
cdk.Tags.of(tenantTemplateStack).add('IsPooledDeploy', String(isPooledDeploy));
cdk.Aspects.of(tenantTemplateStack).add(new DestroyPolicySetter());

const serverlessSaaSPipeline = new ServerlessSaaSPipeline(app, 'ServerlessSaaSPipeline', {
  tenantMappingTable: bootstrapTemplateStack.tenantMappingTable,
  codeCommitRepositoryName: codeCommitRepositoryName,
});
cdk.Aspects.of(serverlessSaaSPipeline).add(new DestroyPolicySetter());