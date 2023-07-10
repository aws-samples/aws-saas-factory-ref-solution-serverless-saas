import abc
class IdentityProviderAbstractClass (abc.ABC):
    @abc.abstractmethod
    def create_idp(self,event):
        pass
    
    @abc.abstractmethod
    def create_idp_tenant_config(self,event):
        pass
    
    @abc.abstractmethod
    def create_operational_idp(self,event):
        pass