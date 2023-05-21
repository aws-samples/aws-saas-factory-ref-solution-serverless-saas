import abc
#https://www.educba.com/interface-in-python/
#https://realpython.com/python-interface/#formal-interfaces
class IdpUserManagementInterface (abc.ABC):
    @abc.abstractmethod
    def create_tenant_admin_user(self, event):
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