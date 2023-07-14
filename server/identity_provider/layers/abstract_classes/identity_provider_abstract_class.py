import abc
class IdentityProviderAbstractClass (abc.ABC):
    @abc.abstractmethod
    def create_tenant(self,event):
        pass
    
    @abc.abstractmethod
    def create_pooled_idp(self,event):
        pass
    
    @abc.abstractmethod
    def create_operational_idp(self,event):
        pass