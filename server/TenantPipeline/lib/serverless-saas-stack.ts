// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import * as fs from 'fs';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Function, Runtime, AssetCode } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';


export class ServerlessSaaSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const artifactsBucket = new s3.Bucket(this, "ArtifactsBucket", {
        encryption: s3.BucketEncryption.S3_MANAGED,
    });
         
    //create IAM policy with lambda basic execution role, write access to s3 and read access to dynamodb
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

    const lambdaFunctionPrep = new Function(this, "prep-deploy", {
        handler: "lambda-prepare-deploy.lambda_handler",
        runtime: Runtime.PYTHON_3_12,
        code: new AssetCode(`./resources`),
        memorySize: 512,
        timeout: Duration.seconds(10),
        environment: {
            BUCKET: artifactsBucket.bucketName,
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
    )


    lambdaFunctionPrep.addToRolePolicy(new iam.PolicyStatement({
        actions: [
          "codepipeline:PutJobSuccessResult",
          "codepipeline:PutJobFailureResult",
          "kms:Decrypt",      
        ],
        resources: ["*"]
      })            
    )
    
    lambdaFunctionPrep.addToRolePolicy(      
      new iam.PolicyStatement({
        actions: [
          //dynamodb read items
          "dynamodb:Query",
          "dynamodb:Scan",      
          "dynamodb:GetItem",        
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/ServerlessSaaS-Settings`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/ServerlessSaaS-TenantStackMapping`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/ServerlessSaaS-TenantDetails`
        ]
      })
    )


    // Pipeline creation starts
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'serverless-saas-pipeline',
      artifactBucket: artifactsBucket
    });

    // Import existing CodeCommit sam-app repository
    const codeRepo = codecommit.Repository.fromRepositoryName(
      this,
      'AppRepository', 
      'aws-saas-factory-ref-serverless-saas' 
    );

    // Declare source code as an artifact
    const sourceOutput = new codepipeline.Artifact();

    // Add source stage to pipeline
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: codeRepo,
          branch: 'main',
          output: sourceOutput,
          variablesNamespace: 'SourceVariables'
        }),
      ],
    });

    // Declare build output as artifacts
    const buildOutput = new codepipeline.Artifact();

    //Declare a new CodeBuild project
    const buildProject = new codebuild.PipelineProject(this, 'Build', {
      buildSpec : codebuild.BuildSpec.fromSourceFilename("server/tenant-buildspec.yml"),
      environment: { buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5 },
      environmentVariables: {
        'PACKAGE_BUCKET': {
          value: artifactsBucket.bucketName
        }
      }
    });

    // Add the build stage to our pipeline
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build-Serverless-SaaS',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    const deployOutput = new codepipeline.Artifact();

    //Add the Lambda function that will deploy the tenant stack in a multitenant way
    pipeline.addStage({
      stageName: 'PrepDeploy',
      actions: [
        new codepipeline_actions.LambdaInvokeAction({
          actionName: 'PrepareDeployment',
          lambda: lambdaFunctionPrep,
          inputs: [buildOutput],
          outputs: [deployOutput],      
          userParameters: {
            'artifact': 'Artifact_Build_Build-Serverless-SaaS',
            'template_file': 'packaged.yaml',
            'commit_id': '#{SourceVariables.CommitId}'
          }
        })        
      ],
    });
    
    const lambdaFunctionIterator = new Function(this, "WaveIterator", {
      handler: "iterator.lambda_handler",
      runtime: Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset("resources", {exclude: ['*.json']}),
      memorySize: 512,
      timeout: Duration.seconds(10),
  })
  
  const approvalQueue = new sqs.Queue(this, 'ApprovalQueue',{
    enforceSSL:true
  });

    const stepfunctionLogGroup = new logs.LogGroup(this,'stepFunctionLG');

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
          resources: [
            approvalQueue.queueArn,            
          ],
          actions: [
                      "sqs:SendMessage"                      
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
    
    const file = fs.readFileSync("./resources/deployemntstatemachine.asl.json");
    
    const deploymentstateMachine = new stepfunctions.CfnStateMachine(this, 'DeploymentCfnStateMachine', {
      roleArn: stepfunction_deploymentrole.roleArn,
      // the properties below are optional
      definitionString: file.toString(),    
      definitionSubstitutions: {
        ITERATOR_LAMBDA_ARN: lambdaFunctionIterator.functionArn,
        APPROVAL_QUEUE_URL: approvalQueue.queueUrl        
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

    const stateMachine = StateMachine.fromStateMachineName(this, 'DeploymentStateMachine', 'serverless-saas-deployment-machine');
    
    const stepFunctionAction = new codepipeline_actions.StepFunctionInvokeAction({
      actionName: 'InvokeStepFunc',
      stateMachine: stateMachine,
      stateMachineInput: codepipeline_actions.StateMachineInput.filePath(deployOutput.atPath('output.json'))
        
    });
    
    
    pipeline.addStage({
      stageName: 'InvokeStepFunctions',
      actions: [stepFunctionAction],
    });
  }
}
