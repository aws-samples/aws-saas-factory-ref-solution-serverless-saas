import { Construct } from 'constructs';
import { ApiKey, Period, RestApi, UsagePlan } from 'aws-cdk-lib/aws-apigateway';

interface UsagePlansProps {
  apiGateway: RestApi;
  apiKeyIdBasicTier: string;
  apiKeyIdStandardTier: string;
  apiKeyIdPremiumTier: string;
  apiKeyIdPlatinumTier: string;
  isPooledDeploy: boolean;
}

export class UsagePlans extends Construct {
  public readonly usagePlanBasicTier: UsagePlan;
  public readonly usagePlanStandardTier: UsagePlan;
  public readonly usagePlanPremiumTier: UsagePlan;
  public readonly usagePlanPlatinumTier: UsagePlan;
  public readonly usagePlanSystemAdmin: UsagePlan;
  constructor(scope: Construct, id: string, props: UsagePlansProps) {
    super(scope, id);

    if (props.isPooledDeploy) {
      this.usagePlanBasicTier = props.apiGateway.addUsagePlan('UsagePlanBasicTier', {
        quota: {
          limit: 1000,
          period: Period.DAY,
        },
        throttle: {
          burstLimit: 50,
          rateLimit: 50,
        },
      });

      this.usagePlanBasicTier.addApiKey(
        ApiKey.fromApiKeyId(this, 'ApiKeyBasic', props.apiKeyIdBasicTier)
      );

      this.usagePlanStandardTier = props.apiGateway.addUsagePlan('UsagePlanStandardTier', {
        quota: {
          limit: 3000,
          period: Period.DAY,
        },
        throttle: {
          burstLimit: 100,
          rateLimit: 75,
        },
      });

      this.usagePlanStandardTier.addApiKey(
        ApiKey.fromApiKeyId(this, 'ApiKeyStandard', props.apiKeyIdStandardTier)
      );

      this.usagePlanPremiumTier = props.apiGateway.addUsagePlan('UsagePlanPremiumTier', {
        quota: {
          limit: 5000,
          period: Period.DAY,
        },
        throttle: {
          burstLimit: 200,
          rateLimit: 100,
        },
      });

      this.usagePlanPremiumTier.addApiKey(
        ApiKey.fromApiKeyId(this, 'ApiKeyPremium', props.apiKeyIdPremiumTier)
      );

      for (var usagePlanTier of [
        this.usagePlanBasicTier,
        this.usagePlanStandardTier,
        this.usagePlanPremiumTier,
      ]) {
        usagePlanTier.addApiStage({
          api: props.apiGateway,
          stage: props.apiGateway.deploymentStage,
        });
      }
    } else {
      this.usagePlanPlatinumTier = props.apiGateway.addUsagePlan('UsagePlanPlatinumTier', {
        quota: {
          limit: 10000,
          period: Period.DAY,
        },
        throttle: {
          burstLimit: 300,
          rateLimit: 300,
        },
      });

      this.usagePlanPlatinumTier.addApiKey(
        ApiKey.fromApiKeyId(this, 'ApiKeyPlatinum', props.apiKeyIdPlatinumTier)
      );
      this.usagePlanPlatinumTier.addApiStage({
        api: props.apiGateway,
        stage: props.apiGateway.deploymentStage,
      });
    }

    // todo: check if admin usage plan should be defined here
    // this.usagePlanSystemAdmin = props.apiGateway.addUsagePlan('UsagePlanSystemAdmin', {
    //   quota: {
    //     limit: 10000,
    //     period: Period.DAY,
    //   },
    //   throttle: {
    //     burstLimit: 5000,
    //     rateLimit: 500,
    //   },
    //   name: 'System_Admin_Usage_Plan',
    // });
  }
}
