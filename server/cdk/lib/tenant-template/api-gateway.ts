import { CfnOutput, Duration, aws_iam } from 'aws-cdk-lib';
import * as lambda_python from '@aws-cdk/aws-lambda-python-alpha';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {
  ApiKeySourceType,
  AuthorizationType,
  IdentitySource,
  RestApi,
  TokenAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { UsagePlans } from './usage-plans';
import { CustomApiKey } from '../interfaces/custom-api-key';
import { IdentityDetails } from '../interfaces/identity-details';

interface ApiGatewayProps {
  lambdaServerlessSaaSLayers: lambda.LayerVersion;
  apiKeyBasicTier: CustomApiKey;
  apiKeyStandardTier: CustomApiKey;
  apiKeyPremiumTier: CustomApiKey;
  apiKeyPlatinumTier: CustomApiKey;
  tenantId: string;
  isPooledDeploy: boolean;
  idpDetails: IdentityDetails;
}

export class ApiGateway extends Construct {
  public readonly restApi: RestApi;
  public readonly tenantScopedAccessRole: aws_iam.Role;
  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    const srcPath = process.cwd() + '/../src';
    const authorizerFunction = new lambda_python.PythonFunction(this, 'AuthorizerFunction', {
      entry: srcPath,
      handler: 'lambda_handler',
      index: 'tenant_authorizer.py',
      runtime: lambda.Runtime.PYTHON_3_10,
      tracing: lambda.Tracing.ACTIVE,
      layers: [props.lambdaServerlessSaaSLayers],
      environment: {
        IDP_DETAILS: JSON.stringify(props.idpDetails),
        ...(!props.isPooledDeploy && {
          PLATINUM_TIER_API_KEY: props.apiKeyPlatinumTier.value,
        }),
        ...(props.isPooledDeploy && {
          PREMIUM_TIER_API_KEY: props.apiKeyPremiumTier.value,
        }),
        ...(props.isPooledDeploy && {
          STANDARD_TIER_API_KEY: props.apiKeyStandardTier.value,
        }),
        ...(props.isPooledDeploy && {
          BASIC_TIER_API_KEY: props.apiKeyBasicTier.value,
        }),
      },
    });

    if (!authorizerFunction.role?.roleArn) {
      throw new Error('AuthorizerFunction roleArn is undefined');
    }
    this.tenantScopedAccessRole = new aws_iam.Role(this, 'AuthorizerAccessRole', {
      assumedBy: new aws_iam.ArnPrincipal(authorizerFunction.role?.roleArn),
    });
    authorizerFunction.addEnvironment(
      'AUTHORIZER_ACCESS_ROLE',
      this.tenantScopedAccessRole.roleArn
    );

    this.restApi = new RestApi(this, `TenantAPI-${props.tenantId}`, {
      apiKeySourceType: ApiKeySourceType.AUTHORIZER,
      defaultMethodOptions: {
        apiKeyRequired: true,
        authorizationType: AuthorizationType.CUSTOM,
        authorizer: new TokenAuthorizer(this, 'TenantAPIAuthorizer', {
          handler: authorizerFunction,
          identitySource: IdentitySource.header('Authorization'),
          resultsCacheTtl: Duration.seconds(30),
        }),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    const usagePlans = new UsagePlans(this, 'UsagePlans', {
      apiGateway: this.restApi,
      apiKeyIdBasicTier: props.apiKeyBasicTier.apiKeyId,
      apiKeyIdStandardTier: props.apiKeyStandardTier.apiKeyId,
      apiKeyIdPremiumTier: props.apiKeyPremiumTier.apiKeyId,
      apiKeyIdPlatinumTier: props.apiKeyPlatinumTier.apiKeyId,
      isPooledDeploy: props.isPooledDeploy,
    });
  }
}
