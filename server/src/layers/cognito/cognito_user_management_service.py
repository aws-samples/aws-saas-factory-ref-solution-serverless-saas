import boto3
import cognito.user_management_util as user_management_util
from abstract_classes.idp_user_management_abstract_class import IdpUserManagementAbstractClass


client = boto3.client('cognito-idp')

class CognitoUserManagementService(IdpUserManagementAbstractClass):
    def create_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['details']['userPoolId']
        user_group_name = user_details['tenantId']

        response = user_management_util.create_user(user_pool_id, user_details)
        user_group_exists = user_management_util.user_group_exists(user_pool_id, user_group_name)
        if not user_group_exists:
            user_management_util.create_user_group(user_pool_id, user_group_name)

        user_management_util.add_user_to_group(user_pool_id, user_details['userName'], user_group_name)
        return response

    def get_users(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['details']['userPoolId']
        tenant_id = user_details['tenantId']
        users = []
    
        response = client.list_users_in_group(
                UserPoolId=user_pool_id,
                GroupName=tenant_id
            )
          
        num_of_users = len(response['Users'])
    
        if (num_of_users > 0):
                for user in response['Users']:
                    user_info = UserInfo()
                    for attr in user["Attributes"]:
                        if(attr["Name"] == "custom:userRole"):
                            user_info.user_role = attr["Value"]
    
                        if(attr["Name"] == "email"):
                            user_info.email = attr["Value"] 
                    user_info.enabled = user["Enabled"]
                    user_info.created = user["UserCreateDate"]
                    user_info.modified = user["UserLastModifiedDate"]
                    user_info.status = user["UserStatus"] 
                    user_info.username = user["Username"]
                    users.append(user_info)                    
            
        return users
    

    def get_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['details']['userPoolId']
        user_name = user_details['userName']
        user_group_name = user_details['tenantId']

        if(user_management_util.validate_user_tenancy(user_pool_id, user_name, user_group_name)):
            response = client.admin_get_user(
                UserPoolId=user_pool_id,
                Username=user_name
            )
       
            user_info =  UserInfo()
            user_info.username = response["Username"]
            for attr in response["UserAttributes"]:
                if(attr["Name"] == "custom:userRole"):
                    user_info.role = attr["Value"]    
                if(attr["Name"] == "email"):
                    user_info.email = attr["Value"] 
            return user_info 
        else:
            raise PermissionError("Unauthorized: Access denied")   

    def update_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['details']['userPoolId']
        user_name = user_details['userName']
        user_group_name = user_details['tenantId']

        if(user_management_util.validate_user_tenancy(user_pool_id, user_name, user_group_name)):
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
            return response
        else:
            raise PermissionError("Unauthorized: Access denied")      
        
        
        
    
    def disable_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['details']['userPoolId']
        user_name = user_details['userName']
        user_group_name = user_details['tenantId']

        if(user_management_util.validate_user_tenancy(user_pool_id, user_name, user_group_name)):
            response = client.admin_disable_user(
                    Username=user_name,
                    UserPoolId=user_pool_id
                )
            return response
        else:
            raise PermissionError("Unauthorized: Access denied") 
        
        
    def enable_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['details']['userPoolId']
        user_name = user_details['userName']
        user_group_name = user_details['tenantId']

        if(user_management_util.validate_user_tenancy(user_pool_id, user_name, user_group_name)):
            response = client.admin_enable_user(
                    Username=user_name,
                    UserPoolId=user_pool_id
                )
            return response
        else:
            raise PermissionError("Unauthorized: Access denied")
        
        

    def delete_user(self, event):
        user_details = event
        user_pool_id = user_details['idpDetails']['details']['userPoolId']
        user_name = user_details['userName']
        user_group_name = user_details['tenantId']

        if(user_management_util.validate_user_tenancy(user_pool_id, user_name, user_group_name)):
            response = client.admin_delete_user(
                     UserPoolId=user_pool_id,
                    Username=user_name
                )
            return response 
        else:
            raise PermissionError("Unauthorized: Access denied")
    
    



class UserInfo:
    def __init__(self, username=None, role=None, 
    email=None, status=None, enabled=None, created=None, modified=None):
        self.username = username
        self.role = role
        self.email = email
        self.status = status
        self.enabled = enabled
        self.created = created
        self.modified = modified