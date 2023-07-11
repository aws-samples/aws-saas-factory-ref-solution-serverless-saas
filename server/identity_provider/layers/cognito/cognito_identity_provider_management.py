import boto3
import logger
import uuid
import cognito.user_management_util as user_management_util
from abstract_classes.identity_provider_abstract_class import IdentityProviderAbstractClass 
cognito = boto3.client('cognito-idp')

class CognitoIdentityProviderManagement(IdentityProviderAbstractClass):
    def create_idp(self, event):
        callback_url = event['CallbackURL']
        domain_name = 'PooledTenant'
        idp_details = {}
        idp_details["idp"] = {}

        if (event['dedicatedTenancy']== 'true'):
            domain_name = event['tenantId']

        user_pool_response = self.__create_user_pool(domain_name, callback_url, 'tenant')
        user_pool_id = user_pool_response['UserPool']['Id']
        logger.info (user_pool_id)
        
        app_client_response = self.__create_user_pool_client(user_pool_id, callback_url)
        logger.info(app_client_response)
        app_client_id = app_client_response['UserPoolClient']['ClientId']
        self.__create_user_pool_domain(user_pool_id, domain_name+uuid.uuid1().hex)

        idp_details["idp"]["name"] = "Cognito"
        idp_details["idp"]["userPoolId"] = user_pool_id
        idp_details["idp"]["appClientId"] = app_client_id
        return idp_details

    def create_operational_idp(self, event):
        user_details = {}
        idp_details = {}
        idp_details["idp"] = {}
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
        self.__create_user_pool_domain(user_pool_id, 'operationsusers'+uuid.uuid1().hex)
        tenant_user_group_response = user_management_util.create_user_group(user_pool_id,'SystemAdmins',"User group for system admins {0}".format('SystemAdmins'))
        user_management_util.create_operational_admin(user_pool_id, admin_user_name, user_details, role_name)
        user_management_util.add_user_to_group(user_pool_id, admin_user_name, tenant_user_group_response['Group']['GroupName'])
    
        idp_details["idp"]["name"] = "Cognito"
        idp_details["idp"]["userPoolId"] = user_pool_id
        idp_details["idp"]["appClientId"] = app_client_id

        return idp_details

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
            Domain= tenant_id.lower() + '-serverlesssaas',
            UserPoolId=user_pool_id
        )
        return response