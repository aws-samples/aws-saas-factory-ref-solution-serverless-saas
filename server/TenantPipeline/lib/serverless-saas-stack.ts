// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from '@aws-cdk/core';
import { CfnParameter, Duration } from '@aws-cdk/core'; 

import s3 = require('@aws-cdk/aws-s3');
import codecommit = require('@aws-cdk/aws-codecommit');

import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import codebuild = require('@aws-cdk/aws-codebuild');

import { Function, Runtime, AssetCode } from '@aws-cdk/aws-lambda'
import { PolicyStatement } from "@aws-cdk/aws-iam"


export class ServerlessSaaSStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const artifactsBucket = new s3.Bucket(this, "ArtifactsBucket");

    //Since this lambda is invoking cloudformation which is inturn deploying AWS resources, we are giving overly permissive permissions to this lambda. 
    //You can limit this based upon your use case and AWS Resources you need to deploy.
    const lambdaPolicy = new PolicyStatement()
        lambdaPolicy.addActions("*")
        lambdaPolicy.addResources("*")

    const lambdaFunction = new Function(this, "deploy-tenant-stack", {
        handler: "lambda-deploy-tenant-stack.lambda_handler",
        runtime: Runtime.PYTHON_3_8,
        code: new AssetCode(`./resources`),
        memorySize: 512,
        timeout: Duration.seconds(10),
        environment: {
            BUCKET: artifactsBucket.bucketName,
        },
        initialPolicy: [lambdaPolicy],
    })

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
          branch: 'master',
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
      environment: { buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2 },
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
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.LambdaInvokeAction({
          actionName: 'DeployTenantStack',
          lambda: lambdaFunction,
          inputs: [buildOutput],
          outputs: [deployOutput],
          userParameters: {
            'artifact': 'Artifact_Build_Build-Serverless-SaaS',
            'template_file': 'packaged.yaml',
            'commit_id': '#{SourceVariables.CommitId}'
          }
        }),
      ],
    });    
  }
}
