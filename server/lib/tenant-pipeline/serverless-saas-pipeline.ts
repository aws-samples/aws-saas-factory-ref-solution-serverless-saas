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

export interface ServerlessSaaSPipelineInterface extends cdk.StackProps {
  tenantMappingTable: Table;
  codeCommitRepositoryName: string;
}

export class ServerlessSaaSPipeline extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerlessSaaSPipelineInterface) {
    super(scope, id, props);

    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket: artifactsBucket,
    });

    const codeRepo = codecommit.Repository.fromRepositoryName(
      this,
      'AppRepository',
      props.codeCommitRepositoryName
    );

    const sourceOutput = new codepipeline.Artifact();

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: codeRepo,
          branch: 'main',
          output: sourceOutput,
          variablesNamespace: 'SourceVariables',
        }),
      ],
    });

    const buildOutput = new codepipeline.Artifact();

    const buildProject = new codebuild.PipelineProject(this, 'Deploy', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: 0.2,
        env: {
          shell: 'bash',
          variables: {
            tenantMappingTableName: props.tenantMappingTable.tableName,
            CDK_PARAM_CODE_COMMIT_REPOSITORY_NAME: props.codeCommitRepositoryName,
          },
        },
        phases: {
          install: {
            'runtime-versions': {
              python: 3.11,
              nodejs: 18,
            },
          },
          build: {
            commands: [fs.readFileSync('../scripts/update-tenants.sh', 'utf8')],
          },
        },
      }),
      environment: { buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5, privileged: true },
    });

    // todo: reduce permission scope
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['*'],
      })
    );

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build-Serverless-SaaS',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
          environmentVariables: {
            CDK_PARAM_COMMIT_ID: {
              value: '#{SourceVariables.CommitId}',
            },
          },
        }),
      ],
    });

    new cdk.CfnOutput(this, 'ServerlessSaaSPipeline', {
      value: pipeline.pipelineName,
    });
  }
}
