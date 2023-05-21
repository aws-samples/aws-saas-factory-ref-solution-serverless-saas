import boto3
import logger
import uuid
import cognito.user_management_layer as user_management_layer
import utils
from identity_provider_interface import IdentityProviderInterface 

cognito = boto3.client('cognito-idp')

# Try out dependency injection
class CognitoIdentityProviderManagement(IdentityProviderInterface):
     def create_pooled_idp(self, event):
        tenant_callback_url = event['TenantCallbackURL']
        user_pool_response = self.__create_user_pool('PooledTenant',tenant_callback_url, 'tenant')
        user_pool_id = user_pool_response['UserPool']['Id']
        logger.info (user_pool_id)
        
        app_client_response = self.__create_user_pool_client(user_pool_id, tenant_callback_url)
        logger.info(app_client_response)
        app_client_id = app_client_response['UserPoolClient']['ClientId']
        user_pool_domain_response = self.__create_user_pool_domain(user_pool_id, 'pooledtenant'+uuid.uuid1().hex)

        return {"idp":{"name":"Cognito","userPoolId": user_pool_id, "appClientId": app_client_id }}


     def create_siloed_idp(self, event):
        tenant_callback_url = event['application_site_url']
        tenant_id = event['tenantId']
        user_pool_response = self.__create_user_pool(tenant_id,tenant_callback_url, 'tenant')
        user_pool_id = user_pool_response['UserPool']['Id']
        logger.info (user_pool_id)
        
        app_client_response = self.__create_user_pool_client(user_pool_id, tenant_callback_url)
        logger.info(app_client_response)
        app_client_id = app_client_response['UserPoolClient']['ClientId']
        user_pool_domain_response = self.__create_user_pool_domain(user_pool_id, tenant_id)

        response = {"idp":{"name":"Cognito","userPoolId": user_pool_id, "appClientId": app_client_id }}

        return response

     def create_operational_idp(self, event):
        user_details = {}
        admin_callback_url = event['AdminCallbackURL']
        admin_email = event['AdminEmail']
        role_name = event['SystemAdminRoleName']
        admin_user_name = 'admin'
        
    
        user_details['email'] = admin_email
        user_details['tenantId'] = 'SystemAdmins'

        user_pool_response = self.__create_user_pool('OperationUsers',admin_callback_url, 'admin')
        user_pool_id = user_pool_response['UserPool']['Id']
        logger.info (user_pool_id)
        
        app_client_response = self.__create_user_pool_client(user_pool_id, admin_callback_url)
        logger.info(app_client_response)
        app_client_id = app_client_response['UserPoolClient']['ClientId']
        user_pool_domain_response = self.__create_user_pool_domain(user_pool_id, 'operationsusers'+uuid.uuid1().hex)

        tenant_user_group_response = user_management_layer.create_user_group(user_pool_id,'SystemAdmins',"User group for system admins {0}".format('SystemAdmins'))

        create_tenant_admin_response = user_management_layer.create_operational_admin(user_pool_id, admin_user_name, user_details, role_name)
    
        add_tenant_admin_to_group_response = user_management_layer.add_user_to_group(user_pool_id, admin_user_name, tenant_user_group_response['Group']['GroupName'])
    
        return {"idp":{"name":"Cognito","userPoolId": user_pool_id, "appClientId": app_client_id }}

     def __create_user_pool(self, tenant_id, application_site_url, application_type):
        email_message = ''.join(["Login into ", application_type," UI application at ", 
                        application_site_url,
                        " with username {username} and temporary password {####}"])
        email_subject = ''.join(["Your temporary password for ", application_type,
                            " application"])
        response = cognito.create_user_pool(
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
                        'Mutable': True                    
                    },
                    {
                        'Name': 'tenantId',
                        'AttributeDataType': 'String',
                        'Required': False                    
                    },            
                    {
                        'Name': 'userRole',
                        'AttributeDataType': 'String',
                        'Required': False,
                        'Mutable': True                     
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

     def __create_user_pool_client(self, user_pool_id, callback_url):
        response = cognito.create_user_pool_client(
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
                callback_url,
            ],
            LogoutURLs= [
                callback_url,
            ],
            AllowedOAuthScopes=[
                'email',
                'openid',
                'profile'
            ],
            WriteAttributes=[
                'email',
                'custom:tenantId',
                'custom:userRole'
            ]
        )
        return response

     def __create_user_pool_domain(self, user_pool_id, tenant_id):
        response = cognito.create_user_pool_domain(
            Domain= tenant_id + '-serverlesssaas',
            UserPoolId=user_pool_id
        )
        return response