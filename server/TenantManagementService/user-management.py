# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import boto3
import os
import logger 
import utils
import metrics_manager
import auth_manager
from boto3.dynamodb.conditions import Key
from aws_lambda_powertools import Tracer
import idp_object_factory
tracer = Tracer()
region = os.environ['AWS_REGION']
idp_name = os.environ['IDP_NAME']
dynamodb = boto3.resource('dynamodb')
table_tenant_user_map = dynamodb.Table('ServerlessSaaS-TenantUserMapping')
table_tenant_details = dynamodb.Table('ServerlessSaaS-TenantDetails')
idp_user_mgmt_service = idp_object_factory.get_idp_user_mgmt_object(idp_name)

def create_tenant_admin_user(event, context):
    logger.info(event)
    tenant_details = json.loads(event['body'])
    tenant_id = tenant_details['tenantId']

    create_admin_user_response = idp_user_mgmt_service.create_tenant_admin_user(tenant_details)
    logger.info(create_admin_user_response)

    tenantAdminUserName = create_admin_user_response['tenantAdminUserName']
    tenant_user_mapping_response = __create_user_tenant_mapping(tenantAdminUserName, tenant_id)
    logger.info(tenant_user_mapping_response)
    
    return utils.create_success_response(create_admin_user_response)



@tracer.capture_lambda_handler
#only tenant admin can create users
def create_user(event, context):

    tenant_id = event['requestContext']['authorizer']['tenantId']    
    idp = json.loads(event['requestContext']['authorizer']['idpDetails'])    
    user_role = event['requestContext']['authorizer']['userRole']

    user_details = json.loads(event['body'])

    tracer.put_annotation(key="TenantId", value=tenant_id)
    logger.log_with_tenant_context(event, "Request received to create new user")

    if (auth_manager.isSystemAdmin(user_role)):
        user_tenant_id = user_details['tenantId']
        tenant_details = table_tenant_details.get_item( 
            Key ={
                'tenantId': user_tenant_id
            }
        )
        logger.info(tenant_details)
        idp_details = tenant_details['Item']['idpDetails']    
    else:
        user_tenant_id = tenant_id

    user_details['userTenantId'] = user_tenant_id
    user_details['idpDetails'] = idp_details    

    if (auth_manager.isTenantAdmin(user_role) or auth_manager.isSystemAdmin(user_role)):
        metrics_manager.record_metric(event, "UserCreated", "Count", 1)

        response = idp_user_mgmt_service.create_user(user_details)

        logger.log_with_tenant_context(event, response)
        response_mapping = __create_user_tenant_mapping(user_details['userName'], user_tenant_id)

        logger.log_with_tenant_context(event, "Request completed to create new user ")
        return utils.create_success_response("New user created")
    else:
        logger.log_with_tenant_context(event, "Request completed as unauthorized. Only tenant admin or system admin can create user!")        
        return utils.create_unauthorized_response()


@tracer.capture_lambda_handler
def get_users(event, context):
    tenant_id = event['requestContext']['authorizer']['tenantId']    
    idp_details = json.loads(event['requestContext']['authorizer']['idpDetails'])    
    user_role = event['requestContext']['authorizer']['userRole']  
    users = []
    user_details = {}
    user_details['tenantId'] = tenant_id
    user_details['idpDetails'] = idp_details  
    
    
    tracer.put_annotation(key="TenantId", value=tenant_id)
    
    logger.log_with_tenant_context(event, "Request received to get user")
    
    if (auth_manager.isTenantAdmin(user_role) or auth_manager.isSystemAdmin(user_role)):
        response = idp_user_mgmt_service.get_users(user_details)
        
        logger.log_with_tenant_context(event, response) 
        num_of_users = len(response)
        metrics_manager.record_metric(event, "Number of users", "Count", num_of_users)
        return utils.generate_response(response)
    else:
        logger.log_with_tenant_context(event, "Request completed as unauthorized.")        
        return utils.create_unauthorized_response()
   



@tracer.capture_lambda_handler
def get_user(event, context):
    requesting_user_name = event['requestContext']['authorizer']['userName']    
    tenant_id = event['requestContext']['authorizer']['tenantId']    
    idp_details = json.loads(event['requestContext']['authorizer']['idpDetails'])    
    user_role = event['requestContext']['authorizer']['userRole']    
    user_name = event['pathParameters']['username']  
    user_details = {}
    user_details['tenantId'] = tenant_id
    user_details['idpDetails'] = idp_details
    user_details['userName'] = user_name


    tracer.put_annotation(key="TenantId", value=tenant_id)
    
    logger.log_with_tenant_context(event, "Request received to get user")

    if (auth_manager.isSystemAdmin(user_role)):
        user_tenant_id = event['queryStringParameters']['tenantid']
        tenant_details = table_tenant_details.get_item( 
            Key ={
                'tenantId': user_tenant_id
            }
        )
        logger.info(tenant_details)
        user_details['idpDetails'] = tenant_details['Item']['idpDetails']      

    if (auth_manager.isTenantUser(user_role) and user_name != requesting_user_name):        
        logger.log_with_tenant_context(event, "Request completed as unauthorized. User can only get its information.")        
        return utils.create_unauthorized_response()
    else:
        user_info = idp_user_mgmt_service.get_user_info(user_details)
        metrics_manager.record_metric(event, "UserInfoRequested", "Count", 1)
        if(not auth_manager.isSystemAdmin(user_role) and user_info['tenant_id']!=tenant_id):
            logger.log_with_tenant_context(event, "Request completed as unauthorized. Users in other tenants cannot be accessed")
            return utils.create_unauthorized_response()
        else:
            logger.log_with_tenant_context(event, "Request completed to get new user ")
            return utils.create_success_response(user_info.__dict__)

@tracer.capture_lambda_handler
def update_user(event, context):
    requesting_user_name = event['requestContext']['authorizer']['userName']    
    tenant_id = event['requestContext']['authorizer']['tenantId'] 
    idp_details = json.loads(event['requestContext']['authorizer']['idpDetails'])    
    user_role = event['requestContext']['authorizer']['userRole']
    user_name = event['pathParameters']['username']  
    
    user_details = json.loads(event['body'])
    user_details['tenantId'] = tenant_id
    user_details['idpDetails'] = idp_details
    user_details['userRole'] = user_role
    user_details['userName'] = user_name

      
    tracer.put_annotation(key="TenantId", value=tenant_id)
    
    logger.log_with_tenant_context(event, "Request received to get user")
   
    if (auth_manager.isSystemAdmin(user_role)):
        user_tenant_id = user_details['tenantId']
        tenant_details = table_tenant_details.get_item( 
            Key ={
                'tenantId': user_tenant_id
            }
        )
        logger.info(tenant_details)
        user_details['idpDetails'] = tenant_details['Item']['idpDetails']        
    
    if (auth_manager.isTenantUser(user_role)):                
        logger.log_with_tenant_context(event, "Request completed as unauthorized. Only tenant admin or system admin can update user!")        
        return utils.create_unauthorized_response()
    else:
        user_info = idp_user_mgmt_service.get_user_info(user_details)
        if(not auth_manager.isSystemAdmin(user_role) and user_info.tenant_id!=tenant_id):
            logger.log_with_tenant_context(event, "Request completed as unauthorized. Users in other tenants cannot be accessed")
            return utils.create_unauthorized_response()
        else:
            metrics_manager.record_metric(event, "UserUpdated", "Count", 1)
            response = idp_user_mgmt_service.update_user(user_details)
            logger.log_with_tenant_context(event, response)
            logger.log_with_tenant_context(event, "Request completed to update user ")
            return utils.create_success_response("user updated")    

@tracer.capture_lambda_handler
def disable_user(event, context):
    tenant_id = event['requestContext']['authorizer']['tenantId']    
    idp_details = json.loads(event['requestContext']['authorizer']['idpDetails'])     
    user_role = event['requestContext']['authorizer']['userRole']
    user_name = event['pathParameters']['username']
    user_details = {}
    user_details['tenantId'] = tenant_id
    user_details['idpDetails'] = idp_details
    user_details['userName'] = user_name

    tracer.put_annotation(key="TenantId", value=tenant_id)
    
    logger.log_with_tenant_context(event, "Request received to disable new user")
    
    if (auth_manager.isSystemAdmin(user_role)):
        user_tenant_id = event['queryStringParameters']['tenantid']
        tenant_details = table_tenant_details.get_item( 
            Key ={
                'tenantId': user_tenant_id
            }
        )
        logger.info(tenant_details)
        user_details['idpDetails'] = tenant_details['Item']['idpDetails']        
    
    if (auth_manager.isTenantAdmin(user_role) or auth_manager.isSystemAdmin(user_role)):
        user_info = idp_user_mgmt_service.get_user_info(user_details)
        if(not auth_manager.isSystemAdmin(user_role) and user_info.tenant_id!=tenant_id):
            logger.log_with_tenant_context(event, "Request completed as unauthorized. Users in other tenants cannot be accessed")
            return utils.create_unauthorized_response()
        else:
            metrics_manager.record_metric(event, "UserDisabled", "Count", 1)
            response = idp_user_mgmt_service.disable_user(user_details)
            logger.log_with_tenant_context(event, response)
            logger.log_with_tenant_context(event, "Request completed to disable new user ")
            return utils.create_success_response("User disabled")
    else:
        logger.log_with_tenant_context(event, "Request completed as unauthorized. Only tenant admin or system admin can disable user!")        
        return utils.create_unauthorized_response()  

@tracer.capture_lambda_handler
#this method uses IAM Authorization and protected using a resource policy. This method is also invoked async
def disable_users_by_tenant(event, context):
    logger.info("Request received to disable users by tenant")
    logger.info(event)    
    
    
    tenantid_to_update = event['tenantId']
    idp_details = json.loads(event['requestContext']['authorizer']['idpDetails']) 
    user_role =  event['userRole']
    requesting_tenant_id = event['requestingTenantId']
    user_details = {}
    user_details['idpDetails'] = idp_details
    
    tracer.put_annotation(key="TenantId", value=tenantid_to_update)
    
    
    if ((auth_manager.isTenantAdmin(user_role) and tenantid_to_update == requesting_tenant_id) or auth_manager.isSystemAdmin(user_role)):
        filtering_exp = Key('tenantId').eq(tenantid_to_update)
        response = table_tenant_user_map.query(KeyConditionExpression=filtering_exp)
        users = response.get('Items')
        
        for user in users:
            user_details['userName'] = user['userName']
            disable_user_respone = idp_user_mgmt_service.disable_user(user_details)
            
        logger.info(response)
        logger.info("Request completed to disable users")
        return utils.create_success_response("Users disabled")
    else:
        logger.info("Request completed as unauthorized. Only tenant admin or system admin can update!")        
        return utils.create_unauthorized_response()

@tracer.capture_lambda_handler
#this method uses IAM Authorization and protected using a resource policy. This method is also invoked async
def enable_users_by_tenant(event, context):
    logger.info("Request received to enable users by tenant")
    logger.info(event)    
    
    
    tenantid_to_update = event['tenantId']
    idp_details = json.loads(event['requestContext']['authorizer']['idpDetails']) 
    user_role =  event['userRole']
    requesting_tenant_id = event['requestingTenantId']
    user_details = {}
    user_details['idpDetails'] = idp_details
    
    tracer.put_annotation(key="TenantId", value=tenantid_to_update)
    
    
    if (auth_manager.isSystemAdmin(user_role)):
        filtering_exp = Key('tenantId').eq(tenantid_to_update)
        response = table_tenant_user_map.query(KeyConditionExpression=filtering_exp)
        users = response.get('Items')
        
        for user in users:
            user_details['userName'] = user['userName']
            enable_user_response = idp_user_mgmt_service.enable_user(user_details)
            
        logger.info(response)
        logger.info("Request completed to enable users")
        return utils.create_success_response("Users enables")
    else:
        logger.info("Request completed as unauthorized. Only tenant admin or system admin can update!")        
        return utils.create_unauthorized_response()

def __create_user_tenant_mapping(user_name, tenant_id):    
        response = table_tenant_user_map.put_item(
                Item={
                        'tenantId': tenant_id,
                        'userName': user_name
                    }
                )                    
        return response        
