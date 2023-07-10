import abc
class IdpAuthorizerAbstractClass (abc.ABC):
    @abc.abstractmethod
    def validateJWT(self,event):
        pass

    @abc.abstractmethod
    def getClaims(self,event):
        pass
    