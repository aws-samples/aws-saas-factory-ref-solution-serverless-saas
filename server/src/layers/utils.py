# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import jsonpickle
import simplejson

import boto3
from aws_requests_auth.aws_auth import AWSRequestsAuth
from enum import Enum

class TenantTier(Enum):
    PLATINUM    = "Platinum"
    PREMIUM     = "Premium"
    STANDARD    = "Standard"
    BASIC       = "Basic"


class StatusCodes(Enum):
    SUCCESS    = 200
    UN_AUTHORIZED  = 401
    FORBIDDEN = 403
    NOT_FOUND = 404

class Service_Identifier(Enum):
    SHARED_SERVICES     = "SharedServices"
    BUSINESS_SERVICES    = "BusinessServices"

def create_success_response(message):
    return {
        "statusCode": StatusCodes.SUCCESS.value,
        "headers": {
            "Access-Control-Allow-Headers" : "Content-Type, Origin, X-Requested-With, Accept, Authorization, Access-Control-Allow-Methods, Access-Control-Allow-Headers, Access-Control-Allow-Origin",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
        },
        "body": json.dumps({
            "message": message
        }),
    }

def create_unauthorized_response():
    return {
        "statusCode": StatusCodes.UN_AUTHORIZED.value,
        "headers": {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
        },
        "body": json.dumps({
            "message": "User not authorized to perform this action"
        }),
    }

def create_forbidden_response():
    return {
        "statusCode": StatusCodes.FORBIDDEN.value,
        "headers": {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
        },
        "body": json.dumps({
            "message": "User not authorized to perform this action"
        }),
    }

def validate_shard_belongs_to_tenant(tenant_id, shard_id):
    """ Confirms a client supplied partition key belongs to the calling tenant.

    Product and order partition keys are generated as '{tenantId}-{suffix}', so
    the owning tenant is everything before the final '-'. Callers pass these
    keys back to us in the request path, which means they can ask for any key
    they like -- so the key has to be checked against the tenantId the
    Authorizer asserted, not trusted because it was well formed.

    Note the split on the LAST '-' rather than a prefix comparison. A tenant
    named 'acme' must not reach tenant 'acme-corp's partition 'acme-corp-3',
    which both shard_id.startswith('acme-') and the IAM dynamodb:LeadingKeys
    condition 'acme-*' would wrongly allow.

    Args:
        tenant_id (string): tenantId from the Authorizer context
        shard_id (string): partition key taken from the request

    Raises:
        PermissionError: if the partition key belongs to another tenant
    """
    if (shard_id.rsplit('-', 1)[0] != tenant_id):
        raise PermissionError("Unauthorized: Access denied")

def create_notfound_response(message):
    return {
        "statusCode": StatusCodes.NOT_FOUND.value,
        "headers": {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
        },
        "body": json.dumps({
            "message": message
        }),
    }

def get_auth(host, region):
    session = boto3.Session()
    credentials = session.get_credentials()
    auth = AWSRequestsAuth(aws_access_key=credentials.access_key,
                       aws_secret_access_key=credentials.secret_key,
                       aws_token=credentials.token,
                       aws_host=host,
                       aws_region=region,
                       aws_service='execute-api')
    return auth                   

def get_headers(event):
    return event['headers']


def generate_response(inputObject):
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Headers" : "Content-Type, Origin, X-Requested-With, Accept, Authorization, Access-Control-Allow-Methods, Access-Control-Allow-Headers, Access-Control-Allow-Origin",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
        },
        "body": encode_to_json_object(inputObject),
    }

def  encode_to_json_object(inputObject):
    jsonpickle.set_encoder_options('simplejson', use_decimal=True, sort_keys=True)
    jsonpickle.set_preferred_backend('simplejson')
    return jsonpickle.encode(inputObject, unpicklable=False, use_decimal=True)





