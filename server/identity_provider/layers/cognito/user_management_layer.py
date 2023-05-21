import boto3

cognito = boto3.client('cognito-idp')


def create_user_group(user_pool_id, group_name, group_description):
        response = cognito.create_group(
            GroupName=group_name,
            UserPoolId=user_pool_id,
            Description= group_description,
            Precedence=0
        )
        return response

def create_operational_admin( user_pool_id, tenant_admin_user_name, user_details, user_role):
    response = create_user(user_pool_id, tenant_admin_user_name, user_details,'SystemAdmin')
    return response

def create_tenant_admin(user_pool_id, tenant_admin_user_name, user_details):
    user_details['email'] = user_details['tenantEmail']
    response = create_user(user_pool_id, tenant_admin_user_name, user_details,'TenantAdmin')
    return response


def create_user(user_pool_id, tenant_admin_user_name, user_details, user_role):
        response = cognito.admin_create_user(
            Username=tenant_admin_user_name,
            UserPoolId=user_pool_id,
            ForceAliasCreation=True,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': user_details['email']
                },
                {
                    'Name': 'email_verified',
                    'Value': 'true'
                },
                {
                    'Name': 'custom:userRole',
                    'Value': user_role 
                },            
                {
                    'Name': 'custom:tenantId',
                    'Value': user_details['tenantId']
                }
            ]
        )
        return response

def add_user_to_group(user_pool_id, user_name, group_name):
        response = cognito.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=user_name,
            GroupName=group_name
        )
        return response