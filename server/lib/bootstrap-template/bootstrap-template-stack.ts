import { Stack, StackProps,  } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiKeySSMParameterNames } from '../interfaces/api-key-ssm-parameter-names';
import { TenantApiKey } from './tenant-api-key';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyDocument } from 'aws-cdk-lib/aws-iam';
import { CoreApplicationPlane, DetailType } from '@cdklabs/sbt-aws';
import * as fs from 'fs';

interface BootstrapTemplateStackProps extends StackProps {
  ApiKeySSMParameterNames: ApiKeySSMParameterNames;
  apiKeyPlatinumTierParameter: string;
  apiKeyPremiumTierParameter: string;
  apiKeyStandardTierParameter: string;
  apiKeyBasicTierParameter: string;

  controlPlaneSource: string;
  onboardingDetailType: string;
  provisioningDetailType: string;
  applicationNamePlaneSource: string;
  offboardingDetailType: string;
  deprovisioningDetailType: string;
  eventBusArn: string;
  systemAdminEmail: string;
}

export class BootstrapTemplateStack extends Stack {
  public readonly tenantMappingTable: Table;

  constructor(scope: Construct, id: string, props: BootstrapTemplateStackProps) {
    super(scope, id, props);

    const systemAdminEmail = props.systemAdminEmail;
    const eventBusArn = props.eventBusArn;

    this.tenantMappingTable = new Table(this, 'TenantMappingTable', {
      partitionKey: {name: 'tenantId', type: AttributeType.STRING},
    });

    const provisioningJobRunnerProps = {
      name: 'provisioning',
      permissions: PolicyDocument.fromJson(
        JSON.parse(`
{
  "Version":"2012-10-17",
  "Statement":[
      {
        "Action":[
            "*"
        ],
        "Resource":"*",
        "Effect":"Allow"
      }
  ]
}
`)
      ),
      script: fs.readFileSync('../scripts/provision-tenant.sh', 'utf8'),
      postScript: '',
      environmentStringVariablesFromIncomingEvent: ['tenantId', 'tier', 'tenantName', 'email', 'tenantStatus'],
      environmentVariablesToOutgoingEvent: ['tenantConfig', 'tenantStatus'],
      scriptEnvironmentVariables: {
        // CDK_PARAM_SYSTEM_ADMIN_EMAIL is required because as part of deploying the bootstrap-template
        // the control plane is also deployed. To ensure the operation does not error out, this value
        // is provided as an env parameter.
        CDK_PARAM_SYSTEM_ADMIN_EMAIL: systemAdminEmail,
      },
      outgoingEvent: DetailType.PROVISION_SUCCESS,
      incomingEvent: DetailType.ONBOARDING_REQUEST,
    };

    const deprovisioningJobRunnerProps = {
      name: 'deprovisioning',
      permissions: PolicyDocument.fromJson(
        JSON.parse(`
{
  "Version":"2012-10-17",
  "Statement":[
      {
        "Action":[
            "*"
        ],
        "Resource":"*",
        "Effect":"Allow"
      }
  ]
}
`)
      ),
      script: fs.readFileSync('../scripts/deprovision-tenant.sh', 'utf8'),
      importedVariables: ['tenantId', 'tier'],
      exportedVariables: ['tenantStatus'],
      outgoingEvent: DetailType.DEPROVISION_SUCCESS,
      incomingEvent: DetailType.DEACTIVATE_REQUEST,
      scriptEnvironmentVariables: {
        TENANT_STACK_MAPPING_TABLE: this.tenantMappingTable.tableName,
        // CDK_PARAM_SYSTEM_ADMIN_EMAIL is required because as part of deploying the bootstrap-template
        // the control plane is also deployed. To ensure the operation does not error out, this value
        // is provided as an env parameter.
        CDK_PARAM_SYSTEM_ADMIN_EMAIL: systemAdminEmail,
      },
    };

    new CoreApplicationPlane(this, 'CoreApplicationPlane', {
      jobRunnerPropsList: [provisioningJobRunnerProps, deprovisioningJobRunnerProps],
    });

    new TenantApiKey(this, 'BasicTierApiKey', {
      apiKeyValue: props.apiKeyBasicTierParameter,
      ssmParameterApiKeyIdName: props.ApiKeySSMParameterNames.basic.keyId,
      ssmParameterApiValueName: props.ApiKeySSMParameterNames.basic.value,
    });

    new TenantApiKey(this, 'StandardTierApiKey', {
      apiKeyValue: props.apiKeyStandardTierParameter,
      ssmParameterApiKeyIdName: props.ApiKeySSMParameterNames.standard.keyId,
      ssmParameterApiValueName: props.ApiKeySSMParameterNames.standard.value,
    });

    new TenantApiKey(this, 'PremiumTierApiKey', {
      apiKeyValue: props.apiKeyPremiumTierParameter,
      ssmParameterApiKeyIdName: props.ApiKeySSMParameterNames.premium.keyId,
      ssmParameterApiValueName: props.ApiKeySSMParameterNames.premium.value,
    });

    new TenantApiKey(this, 'PlatinumTierApiKey', {
      apiKeyValue: props.apiKeyPlatinumTierParameter,
      ssmParameterApiKeyIdName: props.ApiKeySSMParameterNames.platinum.keyId,
      ssmParameterApiValueName: props.ApiKeySSMParameterNames.platinum.value,
    });
  }
}
