import abc
class IdentityProviderAbstractClass (abc.ABC):
    @abc.abstractmethod
    def create_tenant(self,event):
        """
        Creates idp object for a given tenant during onboarding

        Parameters:
        - event: {
            'tenantName': '',
            'tenantEmail': '',
            'tenantTier': 'Basic',
            'tenantPhone': null,
            'tenantAddress': null,
            'dedicatedTenancy': 'true|false',
            'tenantId': 'aff89d5922a211eebc6e8bce2639e939',
            'apiKey': '',
            'pooledIdpDetails': {
                'idp': {
                    'name': '',
                    'attr1': 'value',
                    'attr2': 'value'                    
                }
            },
            'callbackURL': 'https://d2gzytd4vp39pr.cloudfront.net/'
        }

        Returns:
        - The created (or pooled) identity provider details. 
        {
            'idp': {
                'name': '',
                'attr1': 'value',
                'attr2': 'value'
            }
        }
        """
        pass
    
    @abc.abstractmethod
    def create_pooled_idp(self,event):
        """
        Create the tenant application pooled identity provider.

        Parameters:
        - event: {
            'callbackURL': 'https://d2gzytd4vp39pr.cloudfront.net/'
        }

        Returns:
        - The created identity provider details specific to the provider
        {
            'idp': {
                'name': '',
                'attr1': 'value',
                'attr2': 'value'
            }
        }
        """
        pass
    
    @abc.abstractmethod
    def create_operational_idp(self,event):
        """
        Creates the admin identity provider.

        Parameters:
        - event: {
            'AdminCallbackURL': 'https://d2gzytd4vp39pr.cloudfront.net/'
            'AdminEmail': ''
            'SystemAdminRoleName': ''
        }

        Returns:
        - The created identity provider details specific to the provider
        {
            'idp': {
                'name': '',
                'attr1': 'value',
                'attr2': 'value'
            }
        }
        """
        pass