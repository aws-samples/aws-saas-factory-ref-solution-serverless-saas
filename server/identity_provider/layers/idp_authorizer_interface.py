import abc
#https://www.educba.com/interface-in-python/
#https://realpython.com/python-interface/#formal-interfaces
class IdpAuthorizerInterface (abc.ABC):
    @abc.abstractmethod
    def validateJWT(self,event):
        pass
    