# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""Shared setup for the server side Python unit tests.

The Lambda functions in server/src are deployed with server/src/layers attached
as a Lambda layer, which puts that directory on the runtime PYTHONPATH. That is
why the application code can write plain imports such as `import auth_manager`
and `import cognito.user_management_util`. These tests reproduce the same layout
so the modules under test import exactly as they do in the deployed function.
"""

import os
import sys

SERVER_SRC = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')

# Mirrors the deployed PYTHONPATH: the shared layer, plus the handler directory
# of each service under test.
for path in (os.path.join(SERVER_SRC, 'layers'),
             os.path.join(SERVER_SRC, 'UserManagementService'),
             os.path.join(SERVER_SRC, 'OrderService'),
             os.path.join(SERVER_SRC, 'ProductService')):
    if path not in sys.path:
        sys.path.insert(0, path)

# The order and product data access modules read these at import time. Pooled is
# the deployment model where tenants share a table, so it is the one the tenant
# isolation tests need to exercise.
os.environ.setdefault('IS_POOLED_DEPLOY', 'true')
os.environ.setdefault('ORDER_TABLE_NAME', 'test-order-table')
os.environ.setdefault('PRODUCT_TABLE_NAME', 'test-product-table')

# Several modules build a boto3 client at import time, which needs a region.
os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')
os.environ.setdefault('AWS_REGION', 'us-east-1')

# Make sure a test can never reach real AWS with real credentials.
os.environ.setdefault('AWS_ACCESS_KEY_ID', 'testing')
os.environ.setdefault('AWS_SECRET_ACCESS_KEY', 'testing')
os.environ.setdefault('AWS_SESSION_TOKEN', 'testing')

# Powertools would otherwise try to emit X-Ray segments outside a Lambda.
os.environ.setdefault('POWERTOOLS_TRACE_DISABLED', '1')
os.environ.setdefault('POWERTOOLS_SERVICE_NAME', 'serverless-saas-tests')
os.environ.setdefault('POWERTOOLS_METRICS_NAMESPACE', 'serverless-saas-tests')
