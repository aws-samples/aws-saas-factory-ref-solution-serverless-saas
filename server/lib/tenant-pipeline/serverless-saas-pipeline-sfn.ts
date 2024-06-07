// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as fs from 'fs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from 'aws-cdk-lib/aws-logs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';

export interface ServerlessSaaSPipelineInterface extends cdk.StackProps {
  tenantMappingTable: Table;
  codeCommitRepositoryName: string;
}

export class ServerlessSaaSPipeline extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerlessSaaSPipelineInterface) {
    super(scope, id, props);

    // CodeCommit repository.
    const repository = codecommit.Repository.fromRepositoryName(this, 'AppRepository', props.codeCommitRepositoryName);

    // Define the CodeBuild project.
    const codeBuildProject = new codebuild.Project(this, 'CdkCodeBuildProject', {
      source: codebuild.Source.codeCommit({
        repository: repository,
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true, // Required for Docker
        environmentVariables: {
          STACK_NAME: {value: 'default-stack-name'},
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm install -g aws-cdk',
            ],
          },
          build: {
            commands: [fs.readFileSync('../scripts/update-tenant.sh', 'utf8')],
          },
        },
      }),
    });

    // Add Permissions.
    codeBuildProject.addToRolePolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['*'],
      })
    );

    // Artifacts bucket for CodePipeline.
    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Define CodePipeline.
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket: artifactsBucket,
    });

    // Source
    const sourceOutput = new codepipeline.Artifact();
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: repository,
          branch: 'main',
          output: sourceOutput,
          variablesNamespace: 'SourceVariables',
        }),
      ],
    });

    const lambdaFunctionIterator = new lambda.Function(this, "WaveIterator", {
      handler: "iterator.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset("resources", {exclude: ['*.json']}),
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
    });

    const stepfunctionLogGroup = new logs.LogGroup(this, 'stepFunctionLG', {
      logGroupName: '/aws/vendedlogs/states/StepFunctionLogging'
    });

    //Step function needs permissions to create resources
    const stepfunction_deploymentpolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: [
            "s3:ListBucket"
          ],
          resources: [
            artifactsBucket.bucketArn,
          ]
        }),
        new iam.PolicyStatement({
          resources: [
            `${artifactsBucket.bucketArn}/*`,
          ],
          actions: [
            "s3:*Object"
          ],
        }),
        new iam.PolicyStatement({
          resources: ["*"],
          actions: [
            "logs:*",
            "cloudwatch:PutMetricAlarm",
            "lambda:*",
            "apigateway:*",
            "dynamodb:*",
            "iam:GetRole",
            "iam:UpdateRole",
            "iam:DeleteRole",
            "iam:CreateRole",
            "iam:ListRoles",
            "iam:PassRole",
            "iam:GetPolicy",
            "iam:PassRole",
            "iam:UpdatePolicy",
            "iam:DetachRolePolicy",
            "iam:AttachRolePolicy",
            "iam:DeleteRolePolicy",
            "iam:DeletePolicy",
            "iam:PutRolePolicy",
            "iam:GetRolePolicy",
            "codedeploy:*",
            "codebuild:StartBuild"
          ],
        }),
      ],
    });

    const stepfunction_deploymentrole = new iam.Role(this, 'StepFunctionRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      description: 'Role assumed by deployment state machine',
      inlinePolicies: {
        deployment_policy: stepfunction_deploymentpolicy,
      },
    });

    const file = fs.readFileSync("./resources/waved-deployment.json");

    const deploymentstateMachine = new stepfunctions.CfnStateMachine(this, 'DeploymentCfnStateMachine', {
      roleArn: stepfunction_deploymentrole.roleArn,
      // the properties below are optional
      definitionString: file.toString(),
      definitionSubstitutions: {
        ITERATOR_LAMBDA_ARN: lambdaFunctionIterator.functionArn,
        TENANT_MAPPING_TABLE: props.tenantMappingTable.tableName,
        CODE_BUILD_PROJECT_NAME: codeBuildProject.projectName
      },
      stateMachineName: 'serverless-saas-deployment-machine',
      stateMachineType: 'STANDARD',
      tracingConfiguration: {
        enabled: true
      },
      loggingConfiguration: {
        level: 'ERROR',
        destinations: [
          {
            cloudWatchLogsLogGroup: {logGroupArn: stepfunctionLogGroup.logGroupArn}
          }
        ]
      }
    });

    const stateMachine = stepfunctions.StateMachine.fromStateMachineName(this, 'DeploymentStateMachine', 'serverless-saas-deployment-machine');

    const stepFunctionAction = new codepipeline_actions.StepFunctionInvokeAction({
      actionName: 'InvokeStepFunc',
      stateMachine: stateMachine,
    });

    pipeline.addStage({
      stageName: 'InvokeStepFunctions',
      actions: [stepFunctionAction],
    });

    new cdk.CfnOutput(this, 'ServerlessSaaSPipeline', {
      value: pipeline.pipelineName,
    });
  }
}
