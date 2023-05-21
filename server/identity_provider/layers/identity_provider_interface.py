import abc
#https://www.educba.com/interface-in-python/
#https://realpython.com/python-interface/#formal-interfaces
class IdentityProviderInterface (abc.ABC):
    @abc.abstractmethod
    def create_pooled_idp(self,event):
        pass
    
    @abc.abstractmethod
    def create_siloed_idp(self,event):
        pass
    
    @abc.abstractmethod
    def create_operational_idp(self,event):
        pass