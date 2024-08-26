import abc
class IdpAuthorizerAbstractClass (abc.ABC):
    
    @abc.abstractmethod
    def validateJWT(self,event):
        pass