# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""End to end tests for the User Management API's authorization.

These drive the real lambda_handler against an in memory Cognito (moto), so the
whole path under test is the shipped one: user_management -> idp_object_factory
-> CognitoUserManagementService -> Cognito.

The first tests pin the rule that an ordinary TenantUser cannot change any user's
role, including their own. The tests that follow prove a legitimate TenantAdmin can
still administer their own tenant.
"""

import importlib
import json
import os
import sys

import boto3
import pytest
from moto import mock_aws

TENANT_ID = 'tenant-a'

# Reloaded per test so the module picks up that test's IDP_DETAILS and binds its
# boto3 clients inside the active moto mock.
RELOADABLE_MODULES = ['user_management',
                      'cognito.cognito_user_management_service',
                      'cognito.user_management_util']


class FakeLambdaContext:
    function_name = 'test-user-management'
    memory_limit_in_mb = 128
    invoked_function_arn = \
        'arn:aws:lambda:us-east-1:123456789012:function:test-user-management'
    aws_request_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'


@pytest.fixture
def api():
    """Yields the freshly imported handler plus a Cognito client and pool id."""
    with mock_aws():
        cognito = boto3.client('cognito-idp', region_name='us-east-1')
        user_pool_id = cognito.create_user_pool(
            PoolName='test-tenant-pool',
            Schema=[
                {'Name': 'tenantId', 'AttributeDataType': 'String', 'Mutable': True},
                {'Name': 'userRole', 'AttributeDataType': 'String', 'Mutable': True},
                {'Name': 'tenantTier', 'AttributeDataType': 'String', 'Mutable': True},
            ],
        )['UserPool']['Id']

        cognito.create_group(GroupName=TENANT_ID, UserPoolId=user_pool_id)
        for user_name, user_role in (('alice', 'TenantUser'), ('bob', 'TenantAdmin')):
            cognito.admin_create_user(
                UserPoolId=user_pool_id,
                Username=user_name,
                UserAttributes=[
                    {'Name': 'email', 'Value': '{0}@example.com'.format(user_name)},
                    {'Name': 'custom:userRole', 'Value': user_role},
                    {'Name': 'custom:tenantId', 'Value': TENANT_ID},
                ],
            )
            cognito.admin_add_user_to_group(
                UserPoolId=user_pool_id, Username=user_name, GroupName=TENANT_ID)

        os.environ['IDP_DETAILS'] = json.dumps(
            {'name': 'Cognito', 'details': {'userPoolId': user_pool_id}})

        for module in RELOADABLE_MODULES:
            sys.modules.pop(module, None)
        user_management = importlib.import_module('user_management')

        yield user_management, cognito, user_pool_id

        for module in RELOADABLE_MODULES:
            sys.modules.pop(module, None)


def build_request(http_method, path, actor_role, body=None):
    """A minimal API Gateway REST proxy event.

    requestContext.authorizer is what the Lambda authorizer populates after it
    validates the caller's JWT, so this is where the caller's trusted identity
    comes from.
    """
    return {
        'httpMethod': http_method,
        'path': path,
        'resource': path,
        'headers': {'Content-Type': 'application/json'},
        'queryStringParameters': None,
        'multiValueQueryStringParameters': None,
        'pathParameters': None,
        'stageVariables': None,
        'isBase64Encoded': False,
        'body': None if body is None else json.dumps(body),
        'requestContext': {
            'requestId': 'test-request',
            'stage': 'prod',
            'httpMethod': http_method,
            'resourcePath': path,
            'identity': {'sourceIp': '127.0.0.1'},
            'authorizer': {
                'tenantId': TENANT_ID,
                'userRole': actor_role,
                'userName': 'test-caller',
            },
        },
    }


def call(user_management, http_method, path, actor_role, body=None):
    return user_management.lambda_handler(
        build_request(http_method, path, actor_role, body), FakeLambdaContext())


def get_role_of(cognito, user_pool_id, user_name):
    user = cognito.admin_get_user(UserPoolId=user_pool_id, Username=user_name)
    for attribute in user['UserAttributes']:
        if attribute['Name'] == 'custom:userRole':
            return attribute['Value']
    return None


# --- a tenant user may not change roles --------------------------------------

@pytest.mark.parametrize('claimed_role', ['SystemAdmin', 'CustomerSupport'])
def test_a_tenant_user_cannot_promote_themselves(api, claimed_role):
    """A user's own role is not theirs to change: the role decides which tenant's
    data the Authorizer will vend a credential for."""
    user_management, cognito, user_pool_id = api

    response = call(user_management, 'PUT', '/users/alice', actor_role='TenantUser',
                    body={'userEmail': 'alice@example.com', 'userRole': claimed_role})

    assert response['statusCode'] == 403
    assert get_role_of(cognito, user_pool_id, 'alice') == 'TenantUser'


def test_a_tenant_user_cannot_create_a_provider_role_account(api):
    """Creating a user is an administrative action, so this route is gated too."""
    user_management, cognito, user_pool_id = api

    response = call(user_management, 'POST', '/users', actor_role='TenantUser',
                    body={'userName': 'mallory', 'userEmail': 'mallory@example.com',
                          'userRole': 'SystemAdmin'})

    assert response['statusCode'] == 403
    with pytest.raises(cognito.exceptions.UserNotFoundException):
        cognito.admin_get_user(UserPoolId=user_pool_id, Username='mallory')


def test_even_a_tenant_admin_cannot_grant_a_provider_role(api):
    """The escalation ceiling: no caller can mint a SaaS provider role here."""
    user_management, cognito, user_pool_id = api

    response = call(user_management, 'PUT', '/users/alice', actor_role='TenantAdmin',
                    body={'userEmail': 'alice@example.com', 'userRole': 'SystemAdmin'})

    assert response['statusCode'] == 403
    assert get_role_of(cognito, user_pool_id, 'alice') == 'TenantUser'


@pytest.mark.parametrize('http_method,path', [
    ('DELETE', '/users/bob/disable'),
    ('PUT', '/users/bob/enable'),
    ('DELETE', '/users/bob'),
])
def test_a_tenant_user_cannot_administer_other_accounts(api, http_method, path):
    user_management, cognito, user_pool_id = api

    response = call(user_management, http_method, path, actor_role='TenantUser')

    assert response['statusCode'] == 403
    cognito.admin_get_user(UserPoolId=user_pool_id, Username='bob')


# --- the legitimate flows must keep working ----------------------------------

def test_a_tenant_admin_can_still_promote_a_user_to_tenant_admin(api):
    user_management, cognito, user_pool_id = api

    response = call(user_management, 'PUT', '/users/alice', actor_role='TenantAdmin',
                    body={'userEmail': 'alice@example.com', 'userRole': 'TenantAdmin'})

    assert response['statusCode'] == 200
    assert get_role_of(cognito, user_pool_id, 'alice') == 'TenantAdmin'


def test_a_tenant_admin_can_still_create_a_tenant_user(api):
    user_management, cognito, user_pool_id = api

    response = call(user_management, 'POST', '/users', actor_role='TenantAdmin',
                    body={'userName': 'carol', 'userEmail': 'carol@example.com',
                          'userRole': 'TenantUser'})

    assert response['statusCode'] == 200
    assert get_role_of(cognito, user_pool_id, 'carol') == 'TenantUser'


@pytest.mark.parametrize('http_method,path', [
    ('DELETE', '/users/alice/disable'),
    ('PUT', '/users/alice/enable'),
    ('DELETE', '/users/alice'),
])
def test_a_tenant_admin_can_still_administer_their_tenants_users(api, http_method, path):
    user_management, _, _ = api

    response = call(user_management, http_method, path, actor_role='TenantAdmin')

    assert response['statusCode'] == 200


@pytest.mark.parametrize('actor_role', ['TenantAdmin', 'TenantUser'])
@pytest.mark.parametrize('path', ['/users', '/users/alice'])
def test_reading_users_within_the_tenant_still_works_for_both_roles(api, actor_role, path):
    """Read access is unchanged by this fix, so the shipped Users screen keeps
    working for every existing deployment."""
    user_management, _, _ = api

    response = call(user_management, 'GET', path, actor_role=actor_role)

    assert response['statusCode'] == 200
