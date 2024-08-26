# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from aws_lambda_powertools import Logger
logger = Logger()

"""Log info messages
"""
def info(log_message):
    #logger.structure_logs(append=True, tenant_id=tenant_id)   
    logger.info (log_message)

"""Log error messages
"""
def error(log_message):
    #logger.structure_logs(append=True, tenant_id=tenant_id)   
    logger.error (log_message)

"""Log with tenant context. Extracts tenant context from the lambda events
"""
def log_with_tenant_context(event, log_message):
    logger.structure_logs(append=True, tenant_id= event['requestContext']['authorizer']['tenantId'])
    logger.info (log_message)