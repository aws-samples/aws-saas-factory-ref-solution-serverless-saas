# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""Tests the authorization the Cognito service enforces on its own.

The REST handler in user_management.py checks the caller's role too, and
test_user_management_authorization.py covers that path. These tests deliberately
bypass the handler and call the service class directly, so that if the handler's
check is ever removed or reordered, this second layer is still proven to refuse.
No Cognito call is reached in any of these cases: the checks run before the
service touches the identity provider, so no mocking is required.
"""

import pytest

from cognito.cognito_user_management_service import CognitoUserManagementService

TENANT_ID = 'tenant-a'


def build_event(actor_role, user_role='TenantUser'):
    event = {
        'idpDetails': {'name': 'Cognito', 'details': {'userPoolId': 'us-east-1_unused'}},
        'tenantId': TENANT_ID,
        'userName': 'alice',
        'userEmail': 'alice@example.com',
        'userRole': user_role,
    }
    if actor_role is not None:
        event['actorRole'] = actor_role
    return event


@pytest.fixture
def service():
    return CognitoUserManagementService()


MUTATING_METHODS = ['create_user', 'update_user', 'disable_user', 'enable_user',
                    'delete_user']


@pytest.mark.parametrize('method_name', MUTATING_METHODS)
@pytest.mark.parametrize('actor_role', ['TenantUser', 'SystemAdmin', 'CustomerSupport', ''])
def test_a_caller_who_may_not_manage_users_is_refused(service, method_name, actor_role):
    with pytest.raises(PermissionError):
        getattr(service, method_name)(build_event(actor_role))


@pytest.mark.parametrize('method_name', MUTATING_METHODS)
def test_a_missing_trusted_role_is_refused_rather_than_raising_key_error(service, method_name):
    """An event that arrives without a trusted role must fail closed."""
    with pytest.raises(PermissionError):
        getattr(service, method_name)(build_event(actor_role=None))


@pytest.mark.parametrize('method_name', ['create_user', 'update_user'])
@pytest.mark.parametrize('assigned_role', ['SystemAdmin', 'CustomerSupport', 'Auditor'])
def test_a_tenant_admin_cannot_assign_a_role_outside_the_tenant(service, method_name,
                                                                assigned_role):
    """The escalation ceiling applies even to a legitimate TenantAdmin."""
    with pytest.raises(PermissionError):
        getattr(service, method_name)(
            build_event('TenantAdmin', user_role=assigned_role))
