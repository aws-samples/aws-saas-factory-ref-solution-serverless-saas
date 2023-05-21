# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import boto3
import logger
import os
import idp_object_factory

from crhelper import CfnResource
helper = CfnResource()

idp_name = os.environ['IDP_NAME']

idp_mgmt_service = idp_object_factory.get_idp_mgmt_object(idp_name)
    
    
@helper.create
@helper.update
def do_action(event, _):
    """ Called as part of bootstrap template. 
        Inserts/Updates Settings table based upon the resources deployed inside bootstrap template
        We use these settings inside tenant template

    Args:
            event ([type]): [description]
            _ ([type]): [description]
    """
    logger.info("Updating settings")
    
    idp_input = {}
    tenant_callback_url = event['ResourceProperties']['TenantCallbackURL']
    # idp_name = event['ResourceProperties']['IDPNAME']
    idp_input['TenantCallbackURL'] = tenant_callback_url
    
    response = json.dumps(idp_mgmt_service.create_pooled_idp(idp_input))
    helper.Data['IdpDetails'] = response
    # helper.Data['IdpDetails'] = "{\"idp\":{\"name\":\"Cognito\",\"userPoolId\": \"user_pool_id\", \"appClientId\": \"app_client_id\" }"
    # helper.Data['IdpName'] = ""
    # helper.Data['userPoolId'] = "userPoolId"
    # helper.Data['appClientId'] = "appClientId"
    # helper.Data['IdpDetails']['idp']['userPoolId'] = "userPoolId"
    # helper.Data['IdpDetails']['idp']['appClientId'] = "appClientId"
    # helper.Data.update({"IdpName":"IdpName"})
    # helper.Data.update({"userPoolId":"userPoolId"})

@helper.delete
def do_nothing(_, __):
    pass

def handler(event, context):   
    helper(event, context)
        
    