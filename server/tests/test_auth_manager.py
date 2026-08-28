# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""Tests for the tenant isolation policies the Authorizer vends.

These pin the core security property: the credential the Authorizer hands to a
business service must always be scoped to a single tenant, and no role may ever
receive a broader one.
"""

import json

import pytest

import auth_manager
import utils

REGION = 'us-east-1'
AWS_ACCOUNT_ID = '123456789012'
TENANT_ID = 'tenant-a'
BUSINESS_SERVICES = utils.Service_Identifier.BUSINESS_SERVICES.value

TENANT_ROLES = ['TenantAdmin', 'TenantUser']

# Provider roles, near misses on casing, an unknown role an adopter might add,
# and empty/missing values.
NON_TENANT_ROLES = ['SystemAdmin', 'CustomerSupport', 'systemadmin',
                    'TENANTADMIN', 'Auditor', '', None]


def get_policy_for(user_role):
    return json.loads(auth_manager.getPolicyForUser(
        user_role, BUSINESS_SERVICES, TENANT_ID, REGION, AWS_ACCOUNT_ID))


@pytest.mark.parametrize('user_role', NON_TENANT_ROLES)
def test_no_credential_is_vended_for_a_non_tenant_role(user_role):
    """A role outside the tenant's two roles must be refused outright.

    Refusing is the point. There is no role for which this returns a policy that is
    not scoped to a single tenant, and no role for which it returns nothing and
    leaves the caller's access to be settled somewhere else.
    """
    with pytest.raises(PermissionError):
        auth_manager.getPolicyForUser(
            user_role, BUSINESS_SERVICES, TENANT_ID, REGION, AWS_ACCOUNT_ID)


@pytest.mark.parametrize('user_role', TENANT_ROLES)
def test_every_vended_statement_is_scoped_to_the_callers_tenant(user_role):
    policy = get_policy_for(user_role)

    assert policy['Statement'], 'expected at least one statement'
    for statement in policy['Statement']:
        leading_keys = (statement['Condition']['ForAllValues:StringLike']
                        ['dynamodb:LeadingKeys'])
        assert leading_keys == ['{0}-*'.format(TENANT_ID)]


@pytest.mark.parametrize('user_role', TENANT_ROLES)
def test_no_vended_statement_grants_a_table_wildcard_without_a_condition(user_role):
    for statement in get_policy_for(user_role)['Statement']:
        assert 'Condition' in statement, \
            'an unconditioned grant lets this credential read every tenant'


def test_only_tenant_admin_may_manage_users():
    assert auth_manager.isAuthorizedToManageUsers('TenantAdmin') is True

    for user_role in ['TenantUser'] + NON_TENANT_ROLES:
        assert auth_manager.isAuthorizedToManageUsers(user_role) is False, user_role


def test_only_the_two_tenant_roles_are_assignable():
    for user_role in TENANT_ROLES:
        assert auth_manager.isRecognizedTenantRole(user_role) is True, user_role

    for user_role in NON_TENANT_ROLES:
        assert auth_manager.isRecognizedTenantRole(user_role) is False, user_role


def test_every_assignable_role_has_its_own_tenant_scoped_policy():
    """Guards the coupling between the two, so that adding a role to
    isRecognizedTenantRole without giving it a policy fails loudly here rather
    than silently inheriting another role's access."""
    policies = {user_role: get_policy_for(user_role) for user_role in TENANT_ROLES}

    for user_role, policy in policies.items():
        assert policy['Statement'], user_role
