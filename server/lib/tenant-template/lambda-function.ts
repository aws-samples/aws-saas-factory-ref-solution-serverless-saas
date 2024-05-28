import { Duration, Stack, aws_dynamodb } from 'aws-cdk-lib';
import * as lambda_python from '@aws-cdk/aws-lambda-python-alpha';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export interface LambdaFunctionProps {
  // tenantId: string;
  entry: string;
  handler: string;
  index: string;
  powertoolsServiceName: string;
  lambdaReserveConcurrency: number;
  lambdaCanaryDeploymentPreference: string;
  isPooledDeploy: boolean;
  lambdaServerlessSaaSLayers: lambda_python.PythonLayerVersion;
  table: aws_dynamodb.Table;
  tableNameEnvKey: string;
}

export class LambdaFunction extends Construct {
  public readonly lambdaFunction: lambda.Function;
  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    const lambdaInsightsLayer = lambda_python.PythonLayerVersion.fromLayerVersionArn(
      this,
      'InsightsLayer',
      `arn:aws:lambda:${Stack.of(this).region}:580247275435:layer:LambdaInsightsExtension:38` // was originally :14 (v14)
    );

    this.lambdaFunction = new lambda_python.PythonFunction(this, 'lambdaFunction', {
      entry: props.entry,
      handler: props.handler,
      timeout: Duration.seconds(30),
      index: props.index,
      runtime: lambda.Runtime.PYTHON_3_10,
      tracing: lambda.Tracing.ACTIVE,
      ...(!props.isPooledDeploy && {
        reservedConcurrentExecutions: props.lambdaReserveConcurrency,
      }),
      layers: [props.lambdaServerlessSaaSLayers, lambdaInsightsLayer],
      environment: {
        IS_POOLED_DEPLOY: String(props.isPooledDeploy),
        POWERTOOLS_SERVICE_NAME: props.powertoolsServiceName,
        POWERTOOLS_METRICS_NAMESPACE: 'ServerlessSaaS',
        LOG_LEVEL: 'DEBUG',
        [props.tableNameEnvKey]: props.table.tableName,
      },
      /*
      missing the following settings found in tenant-template.yaml
------
  GetProductFunction:
    ...
    Properties:
      ...
      AutoPublishAlias: live
      DeploymentPreference:
        Enabled: !Ref LambdaCanaryDeploymentPreference
        Type: Canary10Percent5Minutes
        Alarms:
          - !Ref GetProductFunctionCanaryErrorsAlarm
      Tags:
        TenantId: !Ref TenantIdParameter
------
      */
    });
    this.lambdaFunction.addAlias('live');

    this.lambdaFunction
      .metricErrors({
        period: Duration.seconds(60),
        statistic: cloudwatch.Stats.SUM,
        dimensionsMap: {
          Name: this.lambdaFunction.functionName,
          Resource: `${this.lambdaFunction.functionName}:live`,
          ExecutedVersion: this.lambdaFunction.currentVersion.version,
        },
      })
      .createAlarm(this, 'lambdaFunctionErrorAlarm', {
        threshold: 0,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'lambdaFunctionErrorAlarm',
      });
  }
}
