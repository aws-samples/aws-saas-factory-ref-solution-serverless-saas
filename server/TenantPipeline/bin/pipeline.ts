#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessSaaSStack } from '../lib/serverless-saas-stack';

const app = new cdk.App();
new ServerlessSaaSStack(app, 'serverless-saas-pipeline');
