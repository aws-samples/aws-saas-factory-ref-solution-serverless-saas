import { aws_dynamodb } from 'aws-cdk-lib';
import * as lambda_python from '@aws-cdk/aws-lambda-python-alpha';
import { Construct } from 'constructs';
import { LambdaFunction } from './lambda-function';
import * as aws_apigateway from 'aws-cdk-lib/aws-apigateway';

interface MicroserviceProps {
  lambdaReserveConcurrency: number;
  index: string;
  serviceName: string;
  lambdaCanaryDeploymentPreference: string;
  isPooledDeploy: boolean;
  lambdaServerlessSaaSLayers: lambda_python.PythonLayerVersion;
  entry: string;
  sortKey: string;
  apiGatewayResource: aws_apigateway.Resource;
  tableNameEnvKey: string;
  handlers: {
    create: string;
    get: string;
    getAll: string;
    update: string;
    delete: string;
  };
}

export class Microservice extends Construct {
  public readonly table: aws_dynamodb.Table;
  public readonly getLambdaFunctionConstruct: LambdaFunction;
  public readonly getAllLambdaFunctionConstruct: LambdaFunction;
  public readonly createLambdaFunctionConstruct: LambdaFunction;
  public readonly updateLambdaFunctionConstruct: LambdaFunction;
  public readonly deleteLambdaFunctionConstruct: LambdaFunction;
  public readonly idResource: aws_apigateway.Resource;
  constructor(scope: Construct, id: string, props: MicroserviceProps) {
    super(scope, id);

    this.idResource = props.apiGatewayResource.addResource('{id}');

    this.table = new aws_dynamodb.Table(this, 'Table', {
      billingMode: aws_dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      partitionKey: {
        name: 'shardId',
        type: aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: props.sortKey,
        type: aws_dynamodb.AttributeType.STRING,
      },
    });

    this.getLambdaFunctionConstruct = new LambdaFunction(this, 'GetFunction', {
      entry: props.entry,
      handler: props.handlers.get,
      index: props.index,
      powertoolsServiceName: props.serviceName,
      lambdaCanaryDeploymentPreference: props.lambdaCanaryDeploymentPreference,
      lambdaReserveConcurrency: props.lambdaReserveConcurrency,
      isPooledDeploy: props.isPooledDeploy,
      lambdaServerlessSaaSLayers: props.lambdaServerlessSaaSLayers,
      table: this.table,
      tableNameEnvKey: props.tableNameEnvKey,
    });

    this.idResource.addMethod(
      'GET',
      new aws_apigateway.LambdaIntegration(this.getLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );

    this.table.grantReadData(this.getLambdaFunctionConstruct.lambdaFunction);

    this.getAllLambdaFunctionConstruct = new LambdaFunction(this, 'GetAllFunction', {
      entry: props.entry,
      handler: props.handlers.getAll,
      index: props.index,
      powertoolsServiceName: props.serviceName,
      lambdaCanaryDeploymentPreference: props.lambdaCanaryDeploymentPreference,
      lambdaReserveConcurrency: props.lambdaReserveConcurrency,
      isPooledDeploy: props.isPooledDeploy,
      lambdaServerlessSaaSLayers: props.lambdaServerlessSaaSLayers,
      table: this.table,
      tableNameEnvKey: props.tableNameEnvKey,
    });
    props.apiGatewayResource.addMethod(
      'GET',
      new aws_apigateway.LambdaIntegration(this.getAllLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );

    this.table.grantReadData(this.getAllLambdaFunctionConstruct.lambdaFunction);

    this.createLambdaFunctionConstruct = new LambdaFunction(this, 'CreateFunction', {
      entry: props.entry,
      handler: props.handlers.create,
      index: props.index,
      powertoolsServiceName: props.serviceName,
      lambdaCanaryDeploymentPreference: props.lambdaCanaryDeploymentPreference,
      lambdaReserveConcurrency: props.lambdaReserveConcurrency,
      isPooledDeploy: props.isPooledDeploy,
      lambdaServerlessSaaSLayers: props.lambdaServerlessSaaSLayers,
      table: this.table,
      tableNameEnvKey: props.tableNameEnvKey,
    });
    props.apiGatewayResource.addMethod(
      'POST',
      new aws_apigateway.LambdaIntegration(this.createLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );
    this.table.grantWriteData(this.createLambdaFunctionConstruct.lambdaFunction);

    this.updateLambdaFunctionConstruct = new LambdaFunction(this, 'UpdateFunction', {
      entry: props.entry,
      handler: props.handlers.update,
      index: props.index,
      powertoolsServiceName: props.serviceName,
      lambdaCanaryDeploymentPreference: props.lambdaCanaryDeploymentPreference,
      lambdaReserveConcurrency: props.lambdaReserveConcurrency,
      isPooledDeploy: props.isPooledDeploy,
      lambdaServerlessSaaSLayers: props.lambdaServerlessSaaSLayers,
      table: this.table,
      tableNameEnvKey: props.tableNameEnvKey,
    });
    this.idResource.addMethod(
      'PUT',
      new aws_apigateway.LambdaIntegration(this.createLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );
    this.table.grantWriteData(this.updateLambdaFunctionConstruct.lambdaFunction);

    this.deleteLambdaFunctionConstruct = new LambdaFunction(this, 'DeleteFunction', {
      entry: props.entry,
      handler: props.handlers.delete,
      index: props.index,
      powertoolsServiceName: props.serviceName,
      lambdaCanaryDeploymentPreference: props.lambdaCanaryDeploymentPreference,
      lambdaReserveConcurrency: props.lambdaReserveConcurrency,
      isPooledDeploy: props.isPooledDeploy,
      lambdaServerlessSaaSLayers: props.lambdaServerlessSaaSLayers,
      table: this.table,
      tableNameEnvKey: props.tableNameEnvKey,
    });
    this.idResource.addMethod(
      'DELETE',
      new aws_apigateway.LambdaIntegration(this.createLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );
    this.table.grantWriteData(this.deleteLambdaFunctionConstruct.lambdaFunction);
  }
}
