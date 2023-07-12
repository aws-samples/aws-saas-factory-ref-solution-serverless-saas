# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import boto3
import os
import utils
import uuid
import logger
import requests
import re
import idp_object_factory

region = os.environ['AWS_REGION']
create_tenant_admin_user_resource_path = os.environ['CREATE_TENANT_ADMIN_USER_RESOURCE_PATH']
create_tenant_resource_path = os.environ['CREATE_TENANT_RESOURCE_PATH']
provision_tenant_resource_path = os.environ['PROVISION_TENANT_RESOURCE_PATH']
idp_name = os.environ['IDP_NAME']

platinum_tier_api_key = os.environ['PLATINUM_TIER_API_KEY']
premium_tier_api_key = os.environ['PREMIUM_TIER_API_KEY']
standard_tier_api_key = os.environ['STANDARD_TIER_API_KEY']
basic_tier_api_key = os.environ['BASIC_TIER_API_KEY']

lambda_client = boto3.client('lambda')


idp_mgmt_service = idp_object_factory.get_idp_mgmt_object(idp_name)


def register_tenant(event, context):
    logger.info(event)
    try:
        api_key=''
        tenant_id = uuid.uuid1().hex
        tenant_details = json.loads(event['body'])
        tenant_details['dedicatedTenancy'] = 'false'

        if (tenant_details['tenantTier'].upper() == utils.TenantTier.PLATINUM.value.upper()):
            tenant_details['dedicatedTenancy'] = 'true'
            api_key = platinum_tier_api_key
        elif (tenant_details['tenantTier'].upper() == utils.TenantTier.PREMIUM.value.upper()):
            api_key = premium_tier_api_key
        elif (tenant_details['tenantTier'].upper() == utils.TenantTier.STANDARD.value.upper()):
            api_key = standard_tier_api_key
        elif (tenant_details['tenantTier'].upper() == utils.TenantTier.BASIC.value.upper()):
            api_key = basic_tier_api_key
        tenant_details['tenantId'] = tenant_id
        tenant_details['apiKey'] = api_key        
        
        logger.info(tenant_details)
        
        stage_name = "prod"
        host = event['headers']['Host']
        auth = utils.get_auth(host, region)
        headers = utils.get_headers(event)
        if (tenant_details['dedicatedTenancy'] == 'true'):
            idp_details = idp_mgmt_service.create_idp(tenant_details)
            tenant_details['idpDetails'] = idp_details
        
        create_user_response = __create_tenant_admin_user(tenant_details, headers, auth, host, stage_name)
        
        logger.info (create_user_response)
        tenant_details['idpDetails'] = create_user_response['message']['idpDetails']
        tenant_details['tenantAdminUserName'] = create_user_response['message']['tenantAdminUserName']

        create_tenant_response = __create_tenant(tenant_details, headers, auth, host, stage_name)
        logger.info (create_tenant_response)

        if (tenant_details['dedicatedTenancy'].upper() == 'TRUE'):
            provision_tenant_response = __provision_tenant(tenant_details, headers, auth, host, stage_name)
            logger.info(provision_tenant_response)
        
    except Exception as e:
        logger.error('Error registering a new tenant')
        raise Exception('Error registering a new tenant', e)
    else:
        return utils.create_success_response("You have been registered in our system")

def __create_tenant_admin_user(tenant_details, headers, auth, host, stage_name):
    try:
        url = ''.join(['https://', host, '/', stage_name, create_tenant_admin_user_resource_path])
        logger.info(url)
        response = requests.post(url, data=json.dumps(tenant_details), auth=auth, headers=headers) 
        response_json = response.json()
    except Exception as e:
        logger.error('Error occured while calling the create tenant admin user service')
        raise Exception('Error occured while calling the create tenant admin user service', e)
    else:
        return response_json

def __create_tenant(tenant_details, headers, auth, host, stage_name):
    try:
        url = ''.join(['https://', host, '/', stage_name, create_tenant_resource_path])
        response = requests.post(url, data=json.dumps(tenant_details), auth=auth, headers=headers) 
        response_json = response.json()
    except Exception as e:
        logger.error('Error occured while creating the tenant record in table')
        raise Exception('Error occured while creating the tenant record in table', e) 
    else:
        return response_json

def __provision_tenant(tenant_details, headers, auth, host, stage_name):
    try:
        url = ''.join(['https://', host, '/', stage_name, provision_tenant_resource_path])
        logger.info(url)
        response = requests.post(url, data=json.dumps(tenant_details), auth=auth, headers=headers) 
        response_json = response.json()['message']
    except Exception as e:
        logger.error('Error occured while provisioning the tenant')
        raise Exception('Error occured while creating the tenant record in table', e) 
    else:
        return response_json

              
