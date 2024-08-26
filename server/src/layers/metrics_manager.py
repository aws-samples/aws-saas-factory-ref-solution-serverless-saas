# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
from aws_lambda_powertools import Metrics

metrics = Metrics()


def record_metric(event, metric_name, metric_unit, metric_value):
    """ Record the metric in Cloudwatch using EMF format

    Args:
        event ([type]): [description]
        metric_name ([type]): [description]
        metric_unit ([type]): [description]
        metric_value ([type]): [description]
    """
    metrics.add_dimension(name="tenant_id", value=event['requestContext']['authorizer']['tenantId'])
    metrics.add_metric(name=metric_name, unit=metric_unit, value=metric_value)
    metrics_object = metrics.serialize_metric_set()
    metrics.clear_metrics()
    print(json.dumps(metrics_object))  

