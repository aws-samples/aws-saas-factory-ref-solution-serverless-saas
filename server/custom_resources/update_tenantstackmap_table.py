# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import boto3
import logger

from crhelper import CfnResource
helper = CfnResource()

try:
    dynamodb = boto3.resource('dynamodb')
except Exception as e:
    helper.init_failure(e)
    
@helper.create
@helper.update
def do_action(event, _):
    """ One time entry for pooled tenants inside tenant stack mapping table.
        This ensures that when code pipeline for tenant template is kicked off, it always create a default stack for pooled tenants.
    Args:
        event ([type]): [description]
        _ ([type]): [description]
    """
    logger.info("Updating Tenant Stack Map")

    tenantstackmap_table_name = event['ResourceProperties']['TenantStackMappingTableName']
    
    table_stack_mapping = dynamodb.Table(tenantstackmap_table_name)
    
    response = table_stack_mapping.put_item(
            Item={
                    'tenantId': 'pooled',
                    'stackName' : 'stack-pooled',
                    'waveNumber': '1',
                    'codeCommitId': ''
                }
            )                  
    
@helper.delete
def do_nothing(_, __):
    pass

def handler(event, context):   
    helper(event, context)
        
    