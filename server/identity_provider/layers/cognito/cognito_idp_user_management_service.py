# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
import boto3
import os
import logger 
from aws_lambda_powertools import Tracer
import cognito.user_management_util as user_management_util
from abstract_classes.idp_user_management_abstract_class import IdpUserManagementAbstractClass
from cognito.cognito_identity_provider_management import CognitoIdentityProviderManagement
tracer = Tracer()
region = os.environ['AWS_REGION']
client = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')
table_tenant_user_map = dynamodb.Table('ServerlessSaaS-TenantUserMapping')
table_tenant_details = dynamodb.Table('ServerlessSaaS-TenantDetails')
idp_mgmt = CognitoIdentityProviderManagement()

class CognitoIdpUserManagementService(IdpUserManagementAbstractClass):
    def create_tenant_admin_user(self, event):
        logger.info(event)
        tenant_details = event
        tenant_id = tenant_details['tenantId']
        user_pool_id = tenant_details['idpDetails']['idp']['userPoolId']        
        tenant_user_group_response = user_management_util.create_user_group(user_pool_id, tenant_id, "User group for tenant {0}".format(tenant_id))
        tenant_admin_user_name = 'tenant-admin-{0}'.format(tenant_details['tenantId'])
        user_management_util.create_tenant_admin(user_pool_id, tenant_admin_user_name, tenant_details)
        user_management_util.add_user_to_group(user_pool_id, tenant_admin_user_name, tenant_user_group_response['Group']['GroupName'])
        return { 'tenantAdminUserName': tenant_admin_user_name }

    def create_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['idp']['userPoolId']
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
                    'Name': 'email_verified',
                    'Value': 'true'
                },
                {
                    'Name': 'custom:userRole',
                    'Value': user_details['userRole'] 
                },            
                {
                    'Name': 'custom:tenantId',
                    'Value': user_details['userTenantId']
                }
            ]
        )
        user_management_util.add_user_to_group(user_pool_id, user_details['userName'], user_details['userTenantId'])
        return response

    def get_users(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['idp']['userPoolId']
        tenant_id = user_details['tenantId']  
        users = []
        response = client.list_users(
            UserPoolId=user_pool_id
        )
        num_of_users = len(response['Users'])
        if (num_of_users > 0):
            for user in response['Users']:
                is_same_tenant_user = False
                user_info = UserInfo()
                for attr in user["Attributes"]:
                    if(attr["Name"] == "custom:tenantId" and attr["Value"] == tenant_id):
                        is_same_tenant_user = True
                        user_info.tenant_id = attr["Value"]
                    if(attr["Name"] == "custom:userRole"):
                        user_info.user_role = attr["Value"]
                    if(attr["Name"] == "email"):
                        user_info.email = attr["Value"] 
                if(is_same_tenant_user):
                    user_info.enabled = user["Enabled"]
                    user_info.created = user["UserCreateDate"]
                    user_info.modified = user["UserLastModifiedDate"]
                    user_info.status = user["UserStatus"] 
                    user_info.user_name = user["Username"]
                    users.append(user_info)                    
        return users

    def get_user(self, event):
        return self.get_user_info(event)

    def update_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['idp']['userPoolId']
        user_name = user_details['userName']
        return client.admin_update_user_attributes(
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

    def disable_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['idp']['userPoolId']
        user_name = user_details['userName']
        response = client.admin_disable_user(
            Username=user_name,
            UserPoolId=user_pool_id
        )
        return response

    def enable_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['idp']['userPoolId']
        user_name = user_details['userName']
        return client.admin_enable_user(
            Username=user_name,
            UserPoolId=user_pool_id
        )    

    def get_user_info(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['idp']['userPoolId']
        user_name = user_details['userName']          
        response = client.admin_get_user(
            UserPoolId=user_pool_id,
            Username=user_name
        )
        user_info =  UserInfo()
        user_info.user_name = response["Username"]
        for attr in response["UserAttributes"]:
            if(attr["Name"] == "custom:tenantId"):
                user_info.tenant_id = attr["Value"]
            if(attr["Name"] == "custom:userRole"):
                user_info.user_role = attr["Value"]    
            if(attr["Name"] == "email"):
                user_info.email = attr["Value"] 
        return user_info    

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