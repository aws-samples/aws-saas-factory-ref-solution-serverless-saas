# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""Tenant isolation tests for the order and product services.

An item id has the form '{shardId}:{itemId}' where shardId is
'{tenantId}-{suffix}', and it arrives in the request path, so a caller can name any
tenant's partition. These tests drive the real handlers against an in-memory
DynamoDB (moto) with a shared, pooled table holding two tenants' rows, and assert
that one tenant cannot read, change or delete the other tenant's row.

They deliberately go through the handler rather than calling
utils.validate_shard_belongs_to_tenant directly, so that removing the check from a
data access module is caught here.
"""

import json

import boto3
import pytest
from moto import mock_aws

CALLER_TENANT = 'tenant-a'
OTHER_TENANT = 'tenant-b'

OTHER_SHARD = '{0}-3'.format(OTHER_TENANT)
OTHER_ITEM_ID = 'other-item-0001'
OTHER_KEY = '{0}:{1}'.format(OTHER_SHARD, OTHER_ITEM_ID)

CALLER_SHARD = '{0}-3'.format(CALLER_TENANT)
CALLER_ITEM_ID = 'caller-item-0001'
CALLER_KEY = '{0}:{1}'.format(CALLER_SHARD, CALLER_ITEM_ID)


def build_request(key, tenant_id, body=None):
    """An API Gateway proxy event as the tenant authorizer would leave it.

    In a pooled deployment the data access layer builds its DynamoDB client from
    the credentials the authorizer put in this context.
    """
    return {
        'pathParameters': {'id': key},
        'body': None if body is None else json.dumps(body),
        'requestContext': {
            'authorizer': {
                'tenantId': tenant_id,
                'userRole': 'TenantUser',
                'userName': 'caller',
                'accesskey': 'testing',
                'secretkey': 'testing',
                'sessiontoken': 'testing',
            },
        },
    }


def create_table(table_name, sort_key):
    boto3.client('dynamodb', region_name='us-east-1').create_table(
        TableName=table_name,
        KeySchema=[{'AttributeName': 'shardId', 'KeyType': 'HASH'},
                   {'AttributeName': sort_key, 'KeyType': 'RANGE'}],
        AttributeDefinitions=[{'AttributeName': 'shardId', 'AttributeType': 'S'},
                              {'AttributeName': sort_key, 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST',
    )
    return boto3.resource('dynamodb', region_name='us-east-1').Table(table_name)


def item_exists(table, sort_key, shard_id, item_id):
    response = table.get_item(Key={'shardId': shard_id, sort_key: item_id})
    return 'Item' in response


@pytest.fixture
def orders():
    """A pooled order table holding one row for each of two tenants."""
    with mock_aws():
        import order_service

        table = create_table('test-order-table', 'orderId')
        for shard_id, order_id, name in ((OTHER_SHARD, OTHER_ITEM_ID, 'other tenant order'),
                                         (CALLER_SHARD, CALLER_ITEM_ID, 'caller order')):
            table.put_item(Item={'shardId': shard_id, 'orderId': order_id,
                                 'orderName': name, 'orderProducts': []})
        yield order_service, table


@pytest.fixture
def products():
    """A pooled product table holding one row for each of two tenants."""
    with mock_aws():
        import product_service

        table = create_table('test-product-table', 'productId')
        for shard_id, product_id, name in ((OTHER_SHARD, OTHER_ITEM_ID, 'other tenant product'),
                                           (CALLER_SHARD, CALLER_ITEM_ID, 'caller product')):
            table.put_item(Item={'shardId': shard_id, 'productId': product_id,
                                 'sku': 'sku-1', 'name': name, 'price': 1,
                                 'category': 'test'})
        yield product_service, table


# --- one tenant must not reach another tenant's partitions -------------------

def test_a_tenant_cannot_read_another_tenants_order(orders):
    order_service, _ = orders

    response = order_service.get_order(
        build_request(OTHER_KEY, CALLER_TENANT), None)

    assert response['statusCode'] == 403
    assert 'other tenant order' not in response['body']


def test_a_tenant_cannot_delete_another_tenants_order(orders):
    order_service, table = orders

    response = order_service.delete_order(
        build_request(OTHER_KEY, CALLER_TENANT), None)

    assert response['statusCode'] == 403
    assert item_exists(table, 'orderId', OTHER_SHARD, OTHER_ITEM_ID), \
        'the delete must not have reached DynamoDB'


def test_a_tenant_cannot_overwrite_another_tenants_order(orders):
    order_service, table = orders

    response = order_service.update_order(
        build_request(OTHER_KEY, CALLER_TENANT,
                      body={'orderName': 'overwritten', 'orderProducts': []}), None)

    assert response['statusCode'] == 403
    item = table.get_item(Key={'shardId': OTHER_SHARD, 'orderId': OTHER_ITEM_ID})['Item']
    assert item['orderName'] == 'other tenant order', 'the update must not have reached DynamoDB'


def test_a_tenant_cannot_read_another_tenants_product(products):
    product_service, _ = products

    response = product_service.get_product(
        build_request(OTHER_KEY, CALLER_TENANT), None)

    assert response['statusCode'] == 403
    assert 'other tenant product' not in response['body']


def test_a_tenant_cannot_delete_another_tenants_product(products):
    product_service, table = products

    response = product_service.delete_product(
        build_request(OTHER_KEY, CALLER_TENANT), None)

    assert response['statusCode'] == 403
    assert item_exists(table, 'productId', OTHER_SHARD, OTHER_ITEM_ID), \
        'the delete must not have reached DynamoDB'


def test_a_tenant_cannot_overwrite_another_tenants_product(products):
    product_service, table = products

    response = product_service.update_product(
        build_request(OTHER_KEY, CALLER_TENANT,
                      body={'sku': 'sku-9', 'name': 'overwritten', 'price': 9,
                            'category': 'test'}), None)

    assert response['statusCode'] == 403
    item = table.get_item(Key={'shardId': OTHER_SHARD, 'productId': OTHER_ITEM_ID})['Item']
    assert item['name'] == 'other tenant product', 'the update must not have reached DynamoDB'


# --- a tenant's own data must still be reachable ------------------------------

def test_a_tenant_can_still_read_its_own_order(orders):
    order_service, _ = orders

    response = order_service.get_order(
        build_request(CALLER_KEY, CALLER_TENANT), None)

    assert response['statusCode'] == 200
    assert 'caller order' in response['body']


def test_a_tenant_can_still_read_its_own_product(products):
    product_service, _ = products

    response = product_service.get_product(
        build_request(CALLER_KEY, CALLER_TENANT), None)

    assert response['statusCode'] == 200
    assert 'caller product' in response['body']


def test_a_tenant_can_still_delete_its_own_order(orders):
    order_service, table = orders

    response = order_service.delete_order(
        build_request(CALLER_KEY, CALLER_TENANT), None)

    assert response['statusCode'] == 200
    assert not item_exists(table, 'orderId', CALLER_SHARD, CALLER_ITEM_ID)
