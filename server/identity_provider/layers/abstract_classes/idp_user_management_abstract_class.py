import abc
class IdpUserManagementAbstractClass (abc.ABC):
    @abc.abstractmethod
    def create_tenant_admin_user(self, event):
        """
        Creates the tenant admin user

        Parameters:
        - event: 
        {
            'tenantName': '',
            'tenantEmail': '',
            'tenantTier': 'Basic',
            'tenantPhone': null,
            'tenantAddress': null,
            'dedicatedTenancy': 'true|false',
            'tenantId': 'aff89d5922a211eebc6e8bce2639e939',
            'apiKey': '',
            'idpDetails': {
                'idp': {
                    'name': '',
                    'attr1': 'value',
                    'attr2': 'value'
                }
            }
        }

        Returns:
        - The username of the tenant admin user: 
        { 
            'tenantAdminUserName': ''
        }
        """
        pass

    @abc.abstractmethod
    def create_user(self, event):
        pass
    
    @abc.abstractmethod
    def get_users(self, event):
        pass
    
    @abc.abstractmethod
    def get_user(self, event):
        pass
    
    @abc.abstractmethod
    def update_user(self, event):
        pass
    
    @abc.abstractmethod
    def disable_user(self, event):
        pass
    
    @abc.abstractmethod
    def enable_user(self, event):
        pass
    
    @abc.abstractmethod
    def get_user_info(self, event):
        pass