import abc
class IdpUserManagementAbstractClass (abc.ABC):
    """ Contract for an identity provider specific user management implementation.

    Every method takes a single `event` dict. Alongside the keys it already
    carried (idpDetails, tenantId, userName and, where relevant, userEmail and
    userRole) the event now also carries:

        actorRole -- the role of the caller, as asserted by the API Gateway
                     authorizer and forwarded by the REST handler. It is never
                     read from the request body.

    Implementations of the mutating methods below are expected to authorize the
    caller against actorRole themselves, using the shared predicates in
    auth_manager (isAuthorizedToManageUsers and isRecognizedTenantRole), rather
    than assuming the REST handler already did so. The handler does check, but
    these methods are where the privileged identity provider calls are made, so
    they must not rely on being called from a vetted path.
    """

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
    def delete_user(self, event):
        pass
