import importlib

def get_idp_user_mgmt_object(idp_name):
    
    idp_user_mgmt_impl_class = ''
    if (idp_name.upper() == 'COGNITO'):
        idp_user_mgmt_impl_class = getattr(importlib.import_module("cognito.cognito_idp_user_management_service"), "CognitoIdpUserManagementService")
    elif (idp_name.upper() == 'AUTH0'):
        idp_user_mgmt_impl_class = getattr(importlib.import_module("auth0.auth0_idp_user_management_service"), "Auth0IdpUserManagementService")
       

    return idp_user_mgmt_impl_class()

def get_idp_mgmt_object(idp_name):
    
    idp_impl_class = ''
    if (idp_name.upper() == 'COGNITO'):
        idp_impl_class = getattr(importlib.import_module("cognito.cognito_identity_provider_management"), "CognitoIdentityProviderManagement")
    elif (idp_name.upper() == 'AUTH0'):
        idp_impl_class = getattr(importlib.import_module("auth0.auth0_identity_provider_management"), "Auth0IdentityProviderManagement")
       

    return idp_impl_class() 
    
def get_idp_authorizer_object(idp_name):
    
    idp_authorizer_impl_class = ''
    if (idp_name.upper() == 'COGNITO'):
        idp_authorizer_impl_class = getattr(importlib.import_module("cognito.cognito_idp_authorizer"), "CognitoIdpAuthorizer")
    elif (idp_name.upper() == 'AUTH0'):
        idp_authorizer_impl_class = getattr(importlib.import_module("auth0.auth0_idp_authorizer"), "Auth0IdpAuthorizer")
       

    return idp_authorizer_impl_class()     
    
    
    
    