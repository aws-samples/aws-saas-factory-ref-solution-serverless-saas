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
import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface ServerlessSaaSPipelineInterface extends cdk.StackProps {
  tenantMappingTable: Table;
  codeCommitRepositoryName: string;
}

export class ServerlessSaaSPipeline extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerlessSaaSPipelineInterface) {
    super(scope, id, props);

    // Artifacts bucket.
    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda functions.
    const lambdaPolicy = new iam.PolicyStatement({
      actions: [
        "s3:*Object",
        "logs:CreateLogGroup",
        "logs:PutLogEvents",
        "logs:CreateLogStream",
        "logs:DescribeLogStreams"
      ],
      resources: [
        `${artifactsBucket.bucketArn}/*`,
        `arn:aws:logs:${this.region}:${this.account}`,
      ]
    })

    const lambdaFunctionPrep = new lambda.Function(this, "prep-deploy", {
      handler: "lambda-prepare-deploy.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_9,
      code: new lambda.AssetCode(`./resources`),
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: {
        BUCKET: artifactsBucket.bucketName,
        TENANT_MAPPING_TABLE: props.tenantMappingTable.tableName
      },
      initialPolicy: [lambdaPolicy],
    })

    lambdaFunctionPrep.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:ListBucket"
        ],
        resources: [
          artifactsBucket.bucketArn,
        ]
      })
    );

    lambdaFunctionPrep.addToRolePolicy(new iam.PolicyStatement({
        actions: [
          "codepipeline:PutJobSuccessResult",
          "codepipeline:PutJobFailureResult",
          "kms:Decrypt",
        ],
        resources: ["*"]
      })
    );

    lambdaFunctionPrep.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.tenantMappingTable.tableName}`,
        ]
      })
    );

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

    // Define CodePipeline.
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'serverless-saas-pipeline',
      artifactBucket: artifactsBucket,
    });

    // Source
    const sourceOutput = new codepipeline.Artifact();

    // Add the Source stage.
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

    const deployOutput = new codepipeline.Artifact();

    // Add PrepDeploy stage to retrieve tenant data from dynamoDB.
    pipeline.addStage({
      stageName: 'PrepDeploy',
      actions: [
        new codepipeline_actions.LambdaInvokeAction({
          actionName: 'PrepareDeployment',
          lambda: lambdaFunctionPrep,
          outputs: [deployOutput],
          userParameters: {
            'artifact': 'Artifact_Build_Build-Serverless-SaaS',
            'template_file': 'packaged.yaml',
            'commit_id': '#{SourceVariables.CommitId}'
          }
        })
      ],
    });

    // Create Lambda iterator to cycle through waved deployments.
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

    const approvalQueue = new sqs.Queue(this, 'ApprovalQueue', {
      enforceSSL: true
    });

    // Step function needs permissions to create resources
    const sfnPolicy = new iam.PolicyDocument({
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
            "cloudformation:DescribeStacks",
            "cloudformation:CreateStack",
            "cloudformation:UpdateStack",
            "cloudformation:CreateChangeSet",
            "cloudwatch:PutMetricAlarm",
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
            "codebuild:StartBuild",
            "sqs:sendmessage"
          ],
        }),
      ],
    });

    const stepfunctionDeploymentRole = new iam.Role(this, 'StepFunctionRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      description: 'Role assumed by deployment state machine',
      inlinePolicies: {
        deployment_policy: sfnPolicy,
      },
    });

    const file = fs.readFileSync("./resources/deployemntstatemachine.asl.json");

    new stepfunctions.CfnStateMachine(this, 'DeploymentCfnStateMachine', {
      roleArn: stepfunctionDeploymentRole.roleArn,
      // the properties below are optional
      definitionString: file.toString(),
      definitionSubstitutions: {
        ITERATOR_LAMBDA_ARN: lambdaFunctionIterator.functionArn,
        APPROVAL_QUEUE_URL: approvalQueue.queueUrl,
        TENANT_MAPPING_TABLE: props.tenantMappingTable.tableName,
        CODE_BUILD_PROJECT_NAME: codeBuildProject.projectName,
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
      stateMachineInput: codepipeline_actions.StateMachineInput.filePath(deployOutput.atPath('output.json'))
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