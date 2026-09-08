# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""Tests that the authorizer denies a token whose role has no isolation policy.

The authorizer is what vends the tenant scoped DynamoDB credential, so if it
cannot produce a policy for a role it must refuse the request rather than let it
through. Throwing an error whose message is exactly 'Unauthorized' is how an API
Gateway Lambda authorizer returns 401.
"""

import json
import os
import sys

import pytest

SERVER_SRC = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')
if SERVER_SRC not in sys.path:
    sys.path.insert(0, SERVER_SRC)

METHOD_ARN = 'arn:aws:execute-api:us-east-1:123456789012:abc123/prod/GET/orders'


@pytest.fixture
def authorizer(monkeypatch):
    monkeypatch.setenv('AUTHORIZER_ACCESS_ROLE',
                       'arn:aws:iam::123456789012:role/authorizer-access-role')
    monkeypatch.setenv('IDP_DETAILS', json.dumps(
        {'name': 'Cognito',
         'details': {'userPoolId': 'us-east-1_test', 'appClientId': 'test-client'}}))
    monkeypatch.setenv('BASIC_TIER_API_KEY', 'test-api-key')

    sys.modules.pop('tenant_authorizer', None)
    import tenant_authorizer
    yield tenant_authorizer
    sys.modules.pop('tenant_authorizer', None)


def claims_for(user_role):
    return {
        'sub': 'test-subject',
        'cognito:username': 'alice',
        'custom:tenantId': 'tenant-a',
        'custom:userRole': user_role,
        'custom:tenantTier': 'Basic',
    }


@pytest.mark.parametrize('user_role', ['SystemAdmin', 'CustomerSupport', 'Auditor', ''])
def test_a_role_with_no_isolation_policy_is_denied(authorizer, monkeypatch, user_role):
    """No credential is vended, and the caller is refused."""
    monkeypatch.setattr(authorizer.idp_authorizer_service, 'validateJWT',
                        lambda details: claims_for(user_role))

    def fail_if_called(**kwargs):
        raise AssertionError('a credential must not be vended for an unrecognized role')

    monkeypatch.setattr(authorizer.sts_client, 'assume_role', fail_if_called)

    with pytest.raises(Exception) as raised:
        authorizer.lambda_handler(
            {'authorizationToken': 'Bearer token', 'methodArn': METHOD_ARN}, None)

    # API Gateway turns this exact message into a 401 for the caller.
    assert str(raised.value) == 'Unauthorized'


@pytest.mark.parametrize('user_role', ['TenantAdmin', 'TenantUser'])
def test_a_tenant_role_is_still_vended_a_tenant_scoped_credential(authorizer, monkeypatch,
                                                                  user_role):
    monkeypatch.setattr(authorizer.idp_authorizer_service, 'validateJWT',
                        lambda details: claims_for(user_role))

    vended = {}

    def capture(**kwargs):
        vended.update(kwargs)
        return {'Credentials': {'AccessKeyId': 'a', 'SecretAccessKey': 'b',
                                'SessionToken': 'c'}}

    monkeypatch.setattr(authorizer.sts_client, 'assume_role', capture)

    response = authorizer.lambda_handler(
        {'authorizationToken': 'Bearer token', 'methodArn': METHOD_ARN}, None)

    assert response['context']['tenantId'] == 'tenant-a'
    assert response['context']['userRole'] == user_role

    policy = json.loads(vended['Policy'])
    for statement in policy['Statement']:
        leading_keys = (statement['Condition']['ForAllValues:StringLike']
                        ['dynamodb:LeadingKeys'])
        assert leading_keys == ['tenant-a-*']
