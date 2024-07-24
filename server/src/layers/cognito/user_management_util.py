import boto3

cognito = boto3.client('cognito-idp')


def create_user_group(user_pool_id, group_name):
        response = cognito.create_group(
            GroupName=group_name,
            UserPoolId=user_pool_id,
            Precedence=0
        )
        return response


def create_user(user_pool_id, user_details):
        response = cognito.admin_create_user(
            Username=user_details['userName'],
            UserPoolId=user_pool_id,
            ForceAliasCreation=True,
            UserAttributes=
            [
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

def user_group_exists(user_pool_id, group_name):        
        try:
            response=cognito.get_group(
                   UserPoolId=user_pool_id, 
                   GroupName=group_name)
            return True
        except Exception as e:
            return False

def validate_user_tenancy(user_pool_id, user_name, group_name):
        isValid = False
        list_of_groups = cognito.admin_list_groups_for_user(
            UserPoolId=user_pool_id,
            Username=user_name
        )
        for group in list_of_groups['Groups']:
            if group['GroupName'] == group_name:
                isValid = True
                break
        return isValid            
           

        