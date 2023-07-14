# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import boto3
import utils
from botocore.exceptions import ClientError
import logger
import os
from aws_lambda_powertools import Tracer
tracer = Tracer()

tenant_stack_mapping_table_name = os.environ['TENANT_STACK_MAPPING_TABLE_NAME']

dynamodb = boto3.resource('dynamodb')
codepipeline = boto3.client('codepipeline')
cloudformation = boto3.client('cloudformation')
table_tenant_stack_mapping = dynamodb.Table(tenant_stack_mapping_table_name)

stack_name = 'stack-{0}'
@tracer.capture_lambda_handler
def provision_tenant(event, context):
    logger.info(event)
    tenant_details = json.loads(event['body'])    
    try:          
        response_ddb = table_tenant_stack_mapping.put_item(
            Item={
                    'tenantId': tenant_details['tenantId'],
                    'stackName': stack_name.format(tenant_details['tenantId']),
                    'applyLatestRelease': True,
                    'codeCommitId': ''
                }
            )    
        logger.info(response_ddb)
        codepipeline.start_pipeline_execution(
            name='serverless-saas-pipeline'
        )        
    except Exception as e:
        raise
    else:
        return utils.create_success_response("Tenant Provisioning Started")

@tracer.capture_lambda_handler
#this method uses IAM Authorization and protected using a resource policy. This method is also invoked async
def deprovision_tenant(event, context):
    logger.info("Request received to deprovision a tenant")
    
    tenantid_to_deprovision = event['tenantId']
    
    try:          
        response_ddb = table_tenant_stack_mapping.delete_item(
            Key={
                    'tenantId': tenantid_to_deprovision                    
                }
            )    
        
        logger.info(response_ddb)

        response_cloudformation = cloudformation.delete_stack(
            StackName=stack_name.format(tenantid_to_deprovision)
        )

        logger.info(response_cloudformation)

    except Exception as e:
        raise
    else:
        return utils.create_success_response("Tenant Deprovisioning Started")

 
