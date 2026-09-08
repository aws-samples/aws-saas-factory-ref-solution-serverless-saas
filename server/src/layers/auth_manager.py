# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import utils

# These are the roles being supported in this reference architecture.
#
# TenantAdmin and TenantUser are the only roles that ever exist in a tenant's
# user pool. A tenant is onboarded with a single TenantAdmin (see
# server/scripts/provision-tenant.sh), who may then create TenantUsers through
# the User Management API. They are therefore the only two roles this tenant
# template authorizes, and the only two it will vend a DynamoDB isolation
# policy for.
#
# SystemAdmin and CustomerSupport are SaaS provider roles that belong to the
# control plane. They authenticate against the separate control plane user pool
# created by server/cdk/lib/control-plane-stack.ts, so they can never present a
# valid token to this tenant template's authorizer. They are kept here for
# reference and for provider-side code, but they are deliberately never granted
# access by the functions below.


class UserRoles:
    SYSTEM_ADMIN = "SystemAdmin"
    CUSTOMER_SUPPORT = "CustomerSupport"
    TENANT_ADMIN = "TenantAdmin"
    TENANT_USER = "TenantUser"


def isTenantAdmin(user_role):
    if (user_role == UserRoles.TENANT_ADMIN):
        return True
    else:
        return False


def isSystemAdmin(user_role):
    if (user_role == UserRoles.SYSTEM_ADMIN):
        return True
    else:
        return False


def isSaaSProvider(user_role):
    if (user_role == UserRoles.SYSTEM_ADMIN or user_role == UserRoles.CUSTOMER_SUPPORT):
        return True
    else:
        return False


def isTenantUser(user_role):
    if (user_role == UserRoles.TENANT_USER):
        return True
    else:
        return False


def isRecognizedTenantRole(user_role):
    """ The only two roles that exist inside a tenant's user pool.

    This is the single source of truth for two separate decisions:

    1. The role escalation ceiling. No role outside this set can ever be
       assigned to a user through the User Management API, so no caller can
       grant themselves or anybody else a SaaS provider role.
    2. The set of roles the Authorizer will vend a DynamoDB credential for.
       Every policy produced for these roles is scoped to a single tenant.

    Args:
        user_role (string): the role to test

    Returns:
        bool: True for TenantAdmin or TenantUser, False for everything else
    """
    return isTenantAdmin(user_role) or isTenantUser(user_role)


def isAuthorizedToManageUsers(actor_role):
    """ Whether the caller may create, update, disable, enable or delete users.

    Only a TenantAdmin administers the users of their own tenant. A TenantUser
    may read the tenant's user list but may never change any user, including
    their own account: a user who can edit their own record can choose their own
    role, and the role is what decides the scope of the credential the
    Authorizer vends.

    SystemAdmin is deliberately absent: it is a control plane role that cannot
    authenticate against this tenant template at all, so accepting it here
    would document a permission that can never be exercised.

    Args:
        actor_role (string): the caller's role, taken from the Authorizer
            context and never from the request body

    Returns:
        bool: True only for TenantAdmin
    """
    return isTenantAdmin(actor_role)


def getPolicyForUser(user_role, service_identifier, tenant_id, region, aws_account_id):
    """ This method is being used by Authorizer to get appropriate policy by user role

    Every policy this returns is scoped to a single tenant. There is no role
    that receives an unconditioned grant, so a caller who somehow obtains an
    unexpected role value is denied outright rather than handed broad access.

    Args:
        user_role (string): UserRoles enum
        tenant_id (string):
        region (string):
        aws_account_id (string):

    Returns:
        string: policy that tenant needs to assume

    Raises:
        PermissionError: if no tenant scoped policy is defined for user_role
    """
    if (not isRecognizedTenantRole(user_role)):
        raise PermissionError(
            "Unauthorized: no tenant isolation policy is defined for role '{0}'".format(user_role))

    if (isTenantAdmin(user_role)):
        iam_policy = __getPolicyForTenantAdmin(
            tenant_id, service_identifier, region, aws_account_id)
    elif (isTenantUser(user_role)):
        iam_policy = __getPolicyForTenantUser(
            tenant_id, region, aws_account_id)
    else:
        # Unreachable today. It exists so that adding a role to
        # isRecognizedTenantRole without also giving it a tenant scoped policy
        # here fails loudly instead of silently inheriting another role's access.
        raise PermissionError(
            "Unauthorized: role '{0}' is recognized but has no tenant isolation policy".format(user_role))

    return iam_policy


def __getPolicyForTenantAdmin(tenant_id, sevice_identifier, region, aws_account_id):
    # Note: the shared services branch below is not reachable in this template,
    # because the tenant authorizer only ever asks for BUSINESS_SERVICES. Its
    # second statement covers two tables that are not keyed by tenant id and so
    # carries no LeadingKeys condition. If you wire shared services through this
    # authorizer, scope that statement to the calling tenant first.
    if (sevice_identifier == utils.Service_Identifier.SHARED_SERVICES.value):
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:UpdateItem",
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:Query"
                    ],
                    "Resource": [
                        "arn:aws:dynamodb:{0}:{1}:table/ServerlessSaaS-TenantUserMapping".format(
                            region, aws_account_id),
                        "arn:aws:dynamodb:{0}:{1}:table/ServerlessSaaS-TenantDetails".format(
                            region, aws_account_id)
                    ],
                    "Condition": {
                        "ForAllValues:StringEquals": {
                            "dynamodb:LeadingKeys": [
                                "{0}".format(tenant_id)
                            ]
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:UpdateItem",
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query"
                    ],
                    "Resource": [
                        "arn:aws:dynamodb:{0}:{1}:table/ServerlessSaaS-TenantStackMapping".format(
                            region, aws_account_id),
                        "arn:aws:dynamodb:{0}:{1}:table/ServerlessSaaS-Settings".format(
                            region, aws_account_id)
                    ]
                }
            ]
        }
    else:
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:UpdateItem",
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query"
                    ],
                    "Resource": [
                        "arn:aws:dynamodb:{0}:{1}:table/*".format(
                            region, aws_account_id),
                    ],
                    "Condition": {
                        "ForAllValues:StringLike": {
                            "dynamodb:LeadingKeys": [
                                "{0}-*".format(tenant_id)
                            ]
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:UpdateItem",
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query"
                    ],
                    "Resource": [
                        "arn:aws:dynamodb:{0}:{1}:table/*".format(
                            region, aws_account_id),
                    ],
                    "Condition": {
                        "ForAllValues:StringLike": {
                            "dynamodb:LeadingKeys": [
                                "{0}-*".format(tenant_id)
                            ]
                        }
                    }
                }
            ]
        }
    return json.dumps(policy)


def __getPolicyForTenantUser(tenant_id, region, aws_account_id):

    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:UpdateItem",
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query"
                ],
                "Resource": [
                    "arn:aws:dynamodb:{0}:{1}:table/*".format(
                        region, aws_account_id),
                ],
                "Condition": {
                    "ForAllValues:StringLike": {
                        "dynamodb:LeadingKeys": [
                            "{0}-*".format(tenant_id)
                        ]
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:UpdateItem",
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query"
                ],
                "Resource": [
                    "arn:aws:dynamodb:{0}:{1}:table/*".format(
                        region, aws_account_id),
                ],
                "Condition": {
                    "ForAllValues:StringLike": {
                        "dynamodb:LeadingKeys": [
                            "{0}-*".format(tenant_id)
                        ]
                    }
                }
            }
        ]
    }

    return json.dumps(policy)
