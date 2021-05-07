# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import boto3
import logger

from crhelper import CfnResource
helper = CfnResource()

try:
    dynamodb = boto3.resource('dynamodb')
    apigateway = boto3.client('apigateway')
except Exception as e:
    helper.init_failure(e)

@helper.create
def do_action(event, _):
    """ Usage plans are created as part of bootstrap template.
        This method associates the usage plans for various tiers with tenant Apis

    Args:
        event ([type]): [description]
        _ ([type]): [description]
    """
    logger.info("adding api gateway stage to usage plan")
    api_id = event['ResourceProperties']['ApiGatewayId']
    settings_table_name = event['ResourceProperties']['SettingsTableName']
    is_pooled_deploy = event['ResourceProperties']['IsPooledDeploy']
    stage = event['ResourceProperties']['Stage']
    usage_plan_id_basic = event['ResourceProperties']['UsagePlanBasicTier']
    usage_plan_id_standard = event['ResourceProperties']['UsagePlanStandardTier']
    usage_plan_id_premium = event['ResourceProperties']['UsagePlanPremiumTier']
    usage_plan_id_platinum = event['ResourceProperties']['UsagePlanPlatinumTier']

    table_system_settings = dynamodb.Table(settings_table_name)

    if(is_pooled_deploy == "true"):
        response_apigateway = apigateway.update_usage_plan (
                usagePlanId=usage_plan_id_basic,
                patchOperations=[
                    {
                        'op':'add',
                        'path':'/apiStages',
                        'value': api_id + ":" + stage
                    }
                ]
        )

        response_apigateway = apigateway.update_usage_plan (
                usagePlanId=usage_plan_id_standard,
                patchOperations=[
                    {
                        'op':'add',
                        'path':'/apiStages',
                        'value': api_id + ":" + stage
                    }
                ]
        )
        
        response_apigateway = apigateway.update_usage_plan (
                usagePlanId=usage_plan_id_premium,
                patchOperations=[
                    {
                        'op':'add',
                        'path':'/apiStages',
                        'value': api_id + ":" + stage
                    }
                ]
        )
        
    else:
        
        response_apigateway = apigateway.update_usage_plan (
                usagePlanId=usage_plan_id_platinum,
                patchOperations=[
                    {
                        'op':'add',
                        'path':'/apiStages',
                        'value': api_id + ":" + stage
                    }
                ]
        )
        
@helper.update
@helper.delete
def do_nothing(_, __):
    pass

def handler(event, context):   
    logger.info(event)
    helper(event, context)
        
    