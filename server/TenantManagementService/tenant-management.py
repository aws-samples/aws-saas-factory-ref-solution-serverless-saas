# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
import json
import boto3
from boto3.dynamodb.conditions import Key
import urllib.parse
import utils
from botocore.exceptions import ClientError
import logger
import metrics_manager
import auth_manager
import requests
from aws_requests_auth.aws_auth import AWSRequestsAuth

from aws_lambda_powertools import Tracer
tracer = Tracer()


region = os.environ['AWS_REGION']

#This method has been locked down to be only
def create_tenant(event, context):
    logger.info(event)
    api_gateway_url = ''       
    tenant_details = json.loads(event['body'])

    dynamodb = boto3.resource('dynamodb')
    table_tenant_details = dynamodb.Table('ServerlessSaaS-TenantDetails')#TODO: read table names from env vars
    table_system_settings = dynamodb.Table('ServerlessSaaS-Settings')

    try:          
        # for pooled tenants the apigateway url is saving in settings during stack creation
        # update from there during tenant creation
        if(tenant_details['dedicatedTenancy'].lower()!= 'true'):
            settings_response = table_system_settings.get_item(
                Key={
                    'settingName': 'apiGatewayUrl-Pooled'
                } 
            )
            api_gateway_url = settings_response['Item']['settingValue']

        response = table_tenant_details.put_item(
            Item={
                    'tenantId': tenant_details['tenantId'],
                    'tenantName' : tenant_details['tenantName'],
                    'tenantAddress': tenant_details['tenantAddress'],
                    'tenantEmail': tenant_details['tenantEmail'],
                    'tenantPhone': tenant_details['tenantPhone'],
                    'tenantTier': tenant_details['tenantTier'],
                    'apiKey': tenant_details['apiKey'],
                    'userPoolId': tenant_details['userPoolId'],                 
                    'appClientId': tenant_details['appClientId'],
                    'dedicatedTenancy': tenant_details['dedicatedTenancy'],
                    'isActive': True,
                    'apiGatewayUrl': api_gateway_url
                }
            )                    

    except Exception as e:
        raise Exception('Error creating a new tenant', e)
    else:
        return utils.create_success_response("Tenant Created")

def get_tenants(event, context):
    logger.info(event)
    
    table_tenant_details = __getTenantManagementTable(event)

    try:
        response = table_tenant_details.scan()
    except Exception as e:
        raise Exception('Error getting all tenants', e)
    else:
        return utils.generate_response(response['Items'])    


@tracer.capture_lambda_handler
def update_tenant(event, context):
    
    table_tenant_details = __getTenantManagementTable(event)
    
    requesting_tenant_id = event['requestContext']['authorizer']['tenantId']    
    user_role = event['requestContext']['authorizer']['userRole']

    tenant_details = json.loads(event['body'])
    tenant_id = event['pathParameters']['tenantid']
    
    tracer.put_annotation(key="TenantId", value=tenant_id)
    
    logger.log_with_tenant_context(event, "Request received to update tenant")
    logger.log_with_tenant_context(event, event)      

    if ((auth_manager.isTenantAdmin(user_role) and tenant_id == requesting_tenant_id) or auth_manager.isSystemAdmin(user_role)):
        exiting_tenant_details = table_tenant_details.get_item(
                Key={
                    'tenantId': tenant_id,
                }    
            )             

        if (exiting_tenant_details['Item']['tenantTier'].upper() != tenant_details['tenantTier'].upper()):
            api_key = __getApiKey(tenant_details['tenantTier'])
        else:            
            api_key = exiting_tenant_details['Item']['apiKey']

        response_update = table_tenant_details.update_item(
            Key={
                'tenantId': tenant_id,
            },
            UpdateExpression="set tenantName = :tenantName, tenantAddress = :tenantAddress, tenantEmail = :tenantEmail, tenantPhone = :tenantPhone, tenantTier=:tenantTier, apiKey=:apiKey",
            ExpressionAttributeValues={
                    ':tenantName' : tenant_details['tenantName'],
                    ':tenantAddress': tenant_details['tenantAddress'],
                    ':tenantEmail': tenant_details['tenantEmail'],
                    ':tenantPhone': tenant_details['tenantPhone'],
                    ':tenantTier': tenant_details['tenantTier'],
                    ':apiKey': api_key,
                },
            ReturnValues="UPDATED_NEW"
            )             
            
        
        logger.log_with_tenant_context(event, response_update)     

        logger.log_with_tenant_context(event, "Request completed to update tenant")
        return utils.create_success_response("Tenant Updated")
    else:
        logger.log_with_tenant_context(event, "Request completed as unauthorized. Only tenant admin or system admin can update tenant!")        
        return utils.create_unauthorized_response()

@tracer.capture_lambda_handler
def get_tenant(event, context):
    table_tenant_details = __getTenantManagementTable(event)
    
    requesting_tenant_id = event['requestContext']['authorizer']['tenantId']    
    user_role = event['requestContext']['authorizer']['userRole']

    tenant_id = event['pathParameters']['tenantid']
    tracer.put_annotation(key="TenantId", value=tenant_id)
    
    logger.log_with_tenant_context(event, "Request received to get tenant details")
    logger.log_with_tenant_context(event, event)      

    if ((auth_manager.isTenantAdmin(user_role) and tenant_id == requesting_tenant_id) or auth_manager.isSystemAdmin(user_role)):
        tenant_details = table_tenant_details.get_item(
            Key={
                'tenantId': tenant_id,
            },
            AttributesToGet=[
                'tenantName',
                'tenantAddress',
                'tenantEmail',
                'tenantPhone'
            ]    
        )             
        item = tenant_details['Item']
        tenant_info = TenantInfo(item['tenantName'], item['tenantAddress'],item['tenantEmail'], item['tenantPhone'])
        logger.log_with_tenant_context(event, tenant_info)
        
        logger.log_with_tenant_context(event, "Request completed to get tenant details")
        return utils.create_success_response(tenant_info.__dict__)
    else:
        logger.log_with_tenant_context(event, "Request completed as unauthorized. Only tenant admin or system admin can deactivate tenant!")        
        return utils.create_unauthorized_response()  

@tracer.capture_lambda_handler
def deactivate_tenant(event, context):
    table_tenant_details = __getTenantManagementTable(event)
    
    url_disable_users = os.environ['DISABLE_USERS_BY_TENANT']
    url_deprovision_tenant = os.environ['DEPROVISION_TENANT']
    stage_name = event['requestContext']['stage']
    host = event['headers']['Host']
    auth = utils.get_auth(host, region)
    headers = utils.get_headers(event)

    requesting_tenant_id = event['requestContext']['authorizer']['tenantId']    
    user_role = event['requestContext']['authorizer']['userRole']

    
    tenant_id = event['pathParameters']['tenantid']
    tracer.put_annotation(key="TenantId", value=tenant_id)
    
    logger.log_with_tenant_context(event, "Request received to deactivate tenant")
    logger.log_with_tenant_context(event, event)      

    if ((auth_manager.isTenantAdmin(user_role) and tenant_id == requesting_tenant_id) or auth_manager.isSystemAdmin(user_role)):
        response = table_tenant_details.update_item(
            Key={
                'tenantId': tenant_id,
            },
            UpdateExpression="set isActive = :isActive",
            ExpressionAttributeValues={
                    ':isActive': False
                },
            ReturnValues="ALL_NEW"
            )             
        
        logger.log_with_tenant_context(event, response)

        if (response["Attributes"]["dedicatedTenancy"].upper() == "TRUE"):
            update_details = {}
            update_details['tenantId'] = tenant_id            
            update_user_response = __invoke_deprovision_tenant(update_details, headers, auth, host, stage_name, url_deprovision_tenant)

        
        update_details = {}
        update_details['userPoolId'] = response["Attributes"]['userPoolId']
        update_details['tenantId'] = tenant_id
        update_details['requestingTenantId'] = requesting_tenant_id
        update_details['userRole'] = user_role
        update_user_response = __invoke_disable_users(update_details, headers, auth, host, stage_name, url_disable_users)
        logger.log_with_tenant_context(event, update_user_response)

        logger.log_with_tenant_context(event, "Request completed to deactivate tenant")
        return utils.create_success_response("Tenant Deactivated")
    else:
        logger.log_with_tenant_context(event, "Request completed as unauthorized. Only tenant admin or system admin can deactivate tenant!")        
        return utils.create_unauthorized_response()    

@tracer.capture_lambda_handler
def activate_tenant(event, context):
    table_tenant_details = __getTenantManagementTable(event)
    
    url_enable_users = os.environ['ENABLE_USERS_BY_TENANT']
    url_provision_tenant = os.environ['PROVISION_TENANT']
    stage_name = event['requestContext']['stage']
    host = event['headers']['Host']
    auth = utils.get_auth(host, region)
    headers = utils.get_headers(event)

    requesting_tenant_id = event['requestContext']['authorizer']['tenantId']    
    user_role = event['requestContext']['authorizer']['userRole']

    
    tenant_id = event['pathParameters']['tenantid']
    tracer.put_annotation(key="TenantId", value=tenant_id)
    
    logger.log_with_tenant_context(event, "Request received to activate tenant")
    logger.log_with_tenant_context(event, event)      

    if (auth_manager.isSystemAdmin(user_role)):
        response = table_tenant_details.update_item(
            Key={
                'tenantId': tenant_id,
            },
            UpdateExpression="set isActive = :isActive",
            ExpressionAttributeValues={
                    ':isActive': True
                },
            ReturnValues="ALL_NEW"
            )             
        
        logger.log_with_tenant_context(event, response)

        if (response["Attributes"]["dedicatedTenancy"].upper() == "TRUE"):
            update_details = {}
            update_details['tenantId'] = tenant_id            
            provision_response = __invoke_provision_tenant(update_details, headers, auth, host, stage_name, url_provision_tenant)
            logger.log_with_tenant_context(event, provision_response)
        
        update_details = {}
        update_details['userPoolId'] = response["Attributes"]['userPoolId']
        update_details['tenantId'] = tenant_id
        update_details['requestingTenantId'] = requesting_tenant_id
        update_details['userRole'] = user_role
        update_user_response = __invoke_enable_users(update_details, headers, auth, host, stage_name, url_enable_users)
        logger.log_with_tenant_context(event, update_user_response)

        logger.log_with_tenant_context(event, "Request completed to activate tenant")
        return utils.create_success_response("Tenant Activated")
    else:
        logger.log_with_tenant_context(event, "Request completed as unauthorized. Only system admin can activate tenant!")        
        return utils.create_unauthorized_response()    

def load_tenant_config(event, context):
    logger.info(event)
    params = event['pathParameters']
    tenantName = urllib.parse.unquote(params['tenantname'])

    dynamodb = boto3.resource('dynamodb')
    table_tenant_details = dynamodb.Table('ServerlessSaaS-TenantDetails')#TODO: read table names from env vars
    
    try:
        response = table_tenant_details.query(
            IndexName="ServerlessSaas-TenantConfig",
            KeyConditionExpression=Key('tenantName').eq(tenantName),
            ProjectionExpression="userPoolId, appClientId, apiGatewayUrl"
        ) 
    except Exception as e:
        raise Exception('Error getting tenant config', e)
    else:
        if (response['Count'] == 0):
            return utils.create_notfound_response("Tenant not found."+
            "Please enter exact tenant name used during tenant registration.")
        else:
            return utils.generate_response(response['Items'][0])        

def __invoke_disable_users(update_details, headers, auth, host, stage_name, invoke_url):
    try:
        url = ''.join(['https://', host, '/', stage_name, invoke_url])
        response = requests.put(url, data=json.dumps(update_details), auth=auth, headers=headers) 
        
        logger.info(response.status_code)
        if (int(response.status_code) != int(utils.StatusCodes.SUCCESS.value)):
            raise Exception('Error occured while disabling users for the tenant')     
        
    except Exception as e:
        logger.error('Error occured while disabling users for the tenant')
        raise Exception('Error occured while disabling users for the tenant', e) 
    else:
        return "Success invoking disable users"

def __invoke_deprovision_tenant(update_details, headers, auth, host, stage_name, invoke_url):
    try:
        url = ''.join(['https://', host, '/', stage_name, invoke_url + update_details['tenantId']])
        response = requests.put(url, data=json.dumps(update_details), auth=auth, headers=headers) 
        
        logger.info(response.status_code)
        if (int(response.status_code) != int(utils.StatusCodes.SUCCESS.value)):
            raise Exception('Error occured while deprovisioning tenant')     
        
    except Exception as e:
        logger.error('Error occured while deprovisioning tenant')
        raise Exception('Error occured while deprovisioning tenant', e) 
    else:
        return "Success invoking deprovision tenant"

def __invoke_enable_users(update_details, headers, auth, host, stage_name, invoke_url):
    try:
        url = ''.join(['https://', host, '/', stage_name, invoke_url])
        response = requests.put(url, data=json.dumps(update_details), auth=auth, headers=headers) 
        
        logger.info(response.status_code)
        if (int(response.status_code) != int(utils.StatusCodes.SUCCESS.value)):
            raise Exception('Error occured while enabling users for the tenant')     
        
    except Exception as e:
        logger.error('Error occured while enabling users for the tenant')
        raise Exception('Error occured while enabling users for the tenant', e) 
    else:
        return "Success invoking enable users"

def __invoke_provision_tenant(update_details, headers, auth, host, stage_name, invoke_url):
    try:
        url = ''.join(['https://', host, '/', stage_name, invoke_url])
        response = requests.post(url, data=json.dumps(update_details), auth=auth, headers=headers) 
        
        logger.info(response.status_code)
        if (int(response.status_code) != int(utils.StatusCodes.SUCCESS.value)):
            raise Exception('Error occured while provisioning tenant')     
        
    except Exception as e:
        logger.error('Error occured while provisioning tenant')
        raise Exception('Error occured while provisioning tenant', e) 
    else:
        return "Success invoking provision tenant"

def __getApiKey(tenant_tier):
    if (tenant_tier.upper() == utils.TenantTier.PLATINUM.value.upper()):
        return os.environ['PLATINUM_TIER_API_KEY']
    elif (tenant_tier.upper() == utils.TenantTier.PREMIUM.value.upper()):
        return os.environ['PREMIUM_TIER_API_KEY']
    elif (tenant_tier.upper() == utils.TenantTier.STANDARD.value.upper()):
        return os.environ['STANDARD_TIER_API_KEY']
    elif (tenant_tier.upper() == utils.TenantTier.BASIC.value.upper()):
        return os.environ['BASIC_TIER_API_KEY']

def __getTenantManagementTable(event):
    accesskey = event['requestContext']['authorizer']['accesskey']
    secretkey = event['requestContext']['authorizer']['secretkey']
    sessiontoken = event['requestContext']['authorizer']['sessiontoken']    
    dynamodb = boto3.resource('dynamodb', aws_access_key_id=accesskey, aws_secret_access_key=secretkey, aws_session_token=sessiontoken)
    table_tenant_details = dynamodb.Table('ServerlessSaaS-TenantDetails')#TODO: read table names from env vars
    
    return table_tenant_details

class TenantInfo:
    def __init__(self, tenant_name, tenant_address, tenant_email, tenant_phone):
        self.tenant_name = tenant_name
        self.tenant_address = tenant_address
        self.tenant_email = tenant_email
        self.tenant_phone = tenant_phone

   