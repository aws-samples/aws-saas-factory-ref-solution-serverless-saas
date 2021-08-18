# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import boto3
import os
import sys
import logger 
import utils
import metrics_manager
import auth_manager
from boto3.dynamodb.conditions import Key
from aws_lambda_powertools import Tracer
tracer = Tracer()

client = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')
table_tenant_user_map = dynamodb.Table('ServerlessSaaS-TenantUserMapping')
table_tenant_details = dynamodb.Table('ServerlessSaaS-TenantDetails')

def create_tenant_admin_user(event, context):
    tenant_user_pool_id = os.environ['TENANT_USER_POOL_ID']
    tenant_app_client_id = os.environ['TENANT_APP_CLIENT_ID']
    
    tenant_details = json.loads(event['body'])
    tenant_id = tenant_details['tenantId']
    logger.info(tenant_details)

    user_mgmt = UserManagement()

    if (tenant_details['dedicatedTenancy'] == 'true'):
        user_pool_response = user_mgmt.create_user_pool(tenant_id)
        user_pool_id = user_pool_response['UserPool']['Id']
        logger.info (user_pool_id)
        
        app_client_response = user_mgmt.create_user_pool_client(user_pool_id)
        logger.info(app_client_response)
        app_client_id = app_client_response['UserPoolClient']['ClientId']
        user_pool_domain_response = user_mgmt.create_user_pool_domain(user_pool_id, tenant_id)
        
        logger.info ("New Tenant Created")
    else:
        user_pool_id = tenant_user_pool_id
        app_client_id = tenant_app_client_id

    #Add tenant admin now based upon user pool
    tenant_user_group_response = user_mgmt.create_user_group(user_pool_id,tenant_id,"User group for tenant {0}".format(tenant_id))

    tenant_admin_user_name = 'tenant-admin-{0}'.format(tenant_details['tenantId'])

    create_tenant_admin_response = user_mgmt.create_tenant_admin(user_pool_id, tenant_admin_user_name, tenant_details)
    
    add_tenant_admin_to_group_response = user_mgmt.add_user_to_group(user_pool_id, tenant_admin_user_name, tenant_user_group_response['Group']['GroupName'])
    
    tenant_user_mapping_response = user_mgmt.create_user_tenant_mapping(tenant_admin_user_name,tenant_id)
    
    response = {"userPoolId": user_pool_id, "appClientId": app_client_id, "tenantAdminUserName": tenant_admin_user_name}
    return utils.create_success_response(response)

@tracer.capture_lambda_handler
#only tenant admin can create users
def create_user(event, context):
    
    tenant_id = event['requestContext']['authorizer']['tenantId']    
    user_pool_id = event['requestContext']['authorizer']['userPoolId']    
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
        user_pool_id = tenant_details['Item']['userPoolId']    
    else:
        user_tenant_id = tenant_id

    if (auth_manager.isTenantAdmin(user_role) or auth_manager.isSystemAdmin(user_role)):
        metrics_manager.record_metric(event, "UserCreated", "Count", 1)
        response = client.admin_create_user(
            Username=user_details['userName'],
            UserPoolId=user_pool_id,
            ForceAliasCreation=True,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': user_details['userEmail']
                },
                {
                    'Name': 'custom:userRole',
                    'Value': user_details['userRole'] 
                },            
                {
                    'Name': 'custom:tenantId',
                    'Value': user_tenant_id
                }
            ]
        )
        
        logger.log_with_tenant_context(event, response)
        user_mgmt = UserManagement()
        response_mapping = user_mgmt.create_user_tenant_mapping(user_details['userName'], user_tenant_id)

        logger.log_with_tenant_context(event, "Request completed to create new user ")
        return utils.create_success_response("New user created")
    else:
        logger.log_with_tenant_context(event, "Request completed as unauthorized. Only tenant admin or system admin can create user!")        
        return utils.create_unauthorized_response()

@tracer.capture_lambda_handler
def get_users(event, context):
    tenant_id = event['requestContext']['authorizer']['tenantId']    
    user_pool_id = event['requestContext']['authorizer']['userPoolId']    
    user_role = event['requestContext']['authorizer']['userRole']  
    users = []  
    
    
    tracer.put_annotation(key="TenantId", value=tenant_id)
    
    logger.log_with_tenant_context(event, "Request received to get user")
    
    if (auth_manager.isTenantAdmin(user_role) or auth_manager.isSystemAdmin(user_role)):
        response = client.list_users(
            UserPoolId=user_pool_id
        )
        logger.log_with_tenant_context(event, response) 
        num_of_users = len(response['Users'])
        metrics_manager.record_metric(event, "Number of users", "Count", num_of_users)
        if (num_of_users > 0):
            for user in response['Users']:
                is_same_tenant_user = False
                user_info = UserInfo()
                for attr in user["Attributes"]:
                    if(attr["Name"] == "custom:tenantId" and attr["Value"] == tenant_id):
                        is_same_tenant_user = True

                    if(attr["Name"] == "email"):
                        user_info.email = attr["Value"] 
                if(is_same_tenant_user):
                    user_info.enabled = user["Enabled"]
                    user_info.created = user["UserCreateDate"]
                    user_info.modified = user["UserLastModifiedDate"]
                    user_info.status = user["UserStatus"] 
                    user_info.user_name = user["Username"]
                    users.append(user_info)                    
        
        return utils.generate_response(users)
    else:
        logger.log_with_tenant_context(event, "Request completed as unauthorized.")        
        return utils.create_unauthorized_response()
   



@tracer.capture_lambda_handler
def get_user(event, context):
    requesting_user_name = event['requestContext']['authorizer']['userName']    
    tenant_id = event['requestContext']['authorizer']['tenantId']    
    user_pool_id = event['requestContext']['authorizer']['userPoolId']    
    user_role = event['requestContext']['authorizer']['userRole']    
    user_name = event['pathParameters']['username']  

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
        user_pool_id = tenant_details['Item']['userPoolId']      

    if (auth_manager.isTenantUser(user_role) and user_name != requesting_user_name):        
        logger.log_with_tenant_context(event, "Request completed as unauthorized. User can only get its information.")        
        return utils.create_unauthorized_response()
    else:
        user_info = get_user_info(event, user_pool_id, user_name)
        if(user_info.tenant_id!=tenant_id):
            logger.log_with_tenant_context(event, "Request completed as unauthorized. Users in other tenants cannot be accessed")
            return utils.create_unauthorized_response()
        else:
            logger.log_with_tenant_context(event, "Request completed to get new user ")
            return utils.create_success_response(user_info.__dict__)

@tracer.capture_lambda_handler
def update_user(event, context):
    requesting_user_name = event['requestContext']['authorizer']['userName']    
    tenant_id = event['requestContext']['authorizer']['tenantId']    
    user_pool_id = event['requestContext']['authorizer']['userPoolId']    
    user_role = event['requestContext']['authorizer']['userRole']    
    
    user_details = json.loads(event['body'])

    user_name = event['pathParameters']['username']    

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
        user_pool_id = tenant_details['Item']['userPoolId']        
    
    if (auth_manager.isTenantUser(user_role) and user_name != requesting_user_name):                
        logger.log_with_tenant_context(event, "Request completed as unauthorized. User can only update itself!")        
        return utils.create_unauthorized_response()
    else:
        user_info = get_user_info(event, user_pool_id, user_name)
        if(user_info.tenant_id!=tenant_id):
            logger.log_with_tenant_context(event, "Request completed as unauthorized. Users in other tenants cannot be accessed")
            return utils.create_unauthorized_response()
        else:
            metrics_manager.record_metric(event, "UserUpdated", "Count", 1)            
            response = client.admin_update_user_attributes(
                Username=user_name,
                UserPoolId=user_pool_id,
                UserAttributes=[
                    {
                        'Name': 'email',
                        'Value': user_details['userEmail']
                    },
                    {
                        'Name': 'custom:userRole',
                        'Value': user_details['userRole'] 
                    }
                ]
            )
            logger.log_with_tenant_context(event, response)
            logger.log_with_tenant_context(event, "Request completed to update user ")
            return utils.create_success_response("user updated")    

@tracer.capture_lambda_handler
def disable_user(event, context):
    tenant_id = event['requestContext']['authorizer']['tenantId']    
    user_pool_id = event['requestContext']['authorizer']['userPoolId']    
    user_role = event['requestContext']['authorizer']['userRole']
    user_name = event['pathParameters']['username']

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
        user_pool_id = tenant_details['Item']['userPoolId']        
    
    if (auth_manager.isTenantAdmin(user_role) or auth_manager.isSystemAdmin(user_role)):
        user_info = get_user_info(event, user_pool_id, user_name)
        if(user_info.tenant_id!=tenant_id):
            logger.log_with_tenant_context(event, "Request completed as unauthorized. Users in other tenants cannot be accessed")
            return utils.create_unauthorized_response()
        else:
            metrics_manager.record_metric(event, "UserDisabled", "Count", 1)
            response = client.admin_disable_user(
                Username=user_name,
                UserPoolId=user_pool_id
            )
        
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
    tenant_user_pool_id = event['userPoolId']
    user_role =  event['userRole']
    requesting_tenant_id = event['requestingTenantId']
    
    tracer.put_annotation(key="TenantId", value=tenantid_to_update)
    
    
    if ((auth_manager.isTenantAdmin(user_role) and tenantid_to_update == requesting_tenant_id) or auth_manager.isSystemAdmin(user_role)):
        filtering_exp = Key('tenantId').eq(tenantid_to_update)
        response = table_tenant_user_map.query(KeyConditionExpression=filtering_exp)
        users = response.get('Items')
        
        for user in users:
            response = client.admin_disable_user(
                Username=user['userName'],
                UserPoolId=tenant_user_pool_id
            )
            
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
    tenant_user_pool_id = event['userPoolId']
    user_role =  event['userRole']
    requesting_tenant_id = event['requestingTenantId']
    
    tracer.put_annotation(key="TenantId", value=tenantid_to_update)
    
    
    if (auth_manager.isSystemAdmin(user_role)):
        filtering_exp = Key('tenantId').eq(tenantid_to_update)
        response = table_tenant_user_map.query(KeyConditionExpression=filtering_exp)
        users = response.get('Items')
        
        for user in users:
            response = client.admin_enable_user(
                Username=user['userName'],
                UserPoolId=tenant_user_pool_id
            )
            
        logger.info(response)
        logger.info("Request completed to enable users")
        return utils.create_success_response("Users enables")
    else:
        logger.info("Request completed as unauthorized. Only tenant admin or system admin can update!")        
        return utils.create_unauthorized_response()

def get_user_info(event, user_pool_id, user_name):
    metrics_manager.record_metric(event, "UserInfoRequested", "Count", 1)            
    response = client.admin_get_user(
            UserPoolId=user_pool_id,
            Username=user_name
    )
    logger.log_with_tenant_context(event, response)

    user_info =  UserInfo()
    user_info.user_name = response["Username"]
    for attr in response["UserAttributes"]:
        if(attr["Name"] == "custom:tenantId"):
            user_info.tenant_id = attr["Value"]
        if(attr["Name"] == "custom:userRole"):
            user_info.user_role = attr["Value"]    
        if(attr["Name"] == "email"):
            user_info.email = attr["Value"] 
    logger.log_with_tenant_context(event, user_info)
    return user_info    

class UserManagement:
    def create_user_pool(self, tenant_id):
        application_site_url = os.environ['TENANT_USER_POOL_CALLBACK_URL']
        email_message = ''.join(["Login into tenant UI application at ", 
                        application_site_url,
                        " with username {username} and temporary password {####}"])
        email_subject = "Your temporary password for tenant UI application"  
        response = client.create_user_pool(
            PoolName= tenant_id + '-ServerlessSaaSUserPool',
            AutoVerifiedAttributes=['email'],
            AccountRecoverySetting={
                'RecoveryMechanisms': [
                    {
                        'Priority': 1,
                        'Name': 'verified_email'
                    },
                ]
            },
            Schema=[
                {
                    'Name': 'email',
                    'AttributeDataType': 'String',
                    'Required': True,                    
                },
                {
                    'Name': 'tenantId',
                    'AttributeDataType': 'String',
                    'Required': False,                    
                },            
                {
                    'Name': 'userRole',
                    'AttributeDataType': 'String',
                    'Required': False,                    
                }
            ],
            AdminCreateUserConfig={
                'InviteMessageTemplate': {
                    'EmailMessage': email_message,
                    'EmailSubject': email_subject
                }
            }
        )    
        return response

    def create_user_pool_client(self, user_pool_id):
        user_pool_callback_url = os.environ['TENANT_USER_POOL_CALLBACK_URL']
        response = client.create_user_pool_client(
            UserPoolId= user_pool_id,
            ClientName= 'ServerlessSaaSClient',
            GenerateSecret= False,
            AllowedOAuthFlowsUserPoolClient= True,
            AllowedOAuthFlows=[
                'code', 'implicit'
            ],
            SupportedIdentityProviders=[
                'COGNITO',
            ],
            CallbackURLs=[
                user_pool_callback_url,
            ],
            LogoutURLs= [
                user_pool_callback_url,
            ],
            AllowedOAuthScopes=[
                'email',
                'openid',
                'profile'
            ],
            WriteAttributes=[
                'email',
                'custom:tenantId'
            ]
        )
        return response

    def create_user_pool_domain(self, user_pool_id, tenant_id):
        response = client.create_user_pool_domain(
            Domain= tenant_id + '-serverlesssaas',
            UserPoolId=user_pool_id
        )
        return response

    def create_user_group(self, user_pool_id, group_name, group_description):
        response = client.create_group(
            GroupName=group_name,
            UserPoolId=user_pool_id,
            Description= group_description,
            Precedence=0
        )
        return response

    def create_tenant_admin(self, user_pool_id, tenant_admin_user_name, user_details):
        response = client.admin_create_user(
            Username=tenant_admin_user_name,
            UserPoolId=user_pool_id,
            ForceAliasCreation=True,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': user_details['tenantEmail']
                },
                {
                    'Name': 'custom:userRole',
                    'Value': 'TenantAdmin' 
                },            
                {
                    'Name': 'custom:tenantId',
                    'Value': user_details['tenantId']
                }
            ]
        )
        return response

    def add_user_to_group(self, user_pool_id, user_name, group_name):
        response = client.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=user_name,
            GroupName=group_name
        )
        return response

    def create_user_tenant_mapping(self, user_name, tenant_id):
        response = table_tenant_user_map.put_item(
                Item={
                        'tenantId': tenant_id,
                        'userName': user_name
                    }
                )                    

        return response


class UserInfo:
    def __init__(self, user_name=None, tenant_id=None, user_role=None, 
    email=None, status=None, enabled=None, created=None, modified=None):
        self.user_name = user_name
        self.tenant_id = tenant_id
        self.user_role = user_role
        self.email = email
        self.status = status
        self.enabled = enabled
        self.created = created
        self.modified = modified
  