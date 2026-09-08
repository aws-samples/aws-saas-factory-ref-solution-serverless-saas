# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""Tests for the partition key check the order and product services apply.

Callers pass a '{tenantId}-{suffix}:{itemId}' key back to us in the request path,
so the partition key is caller controlled and has to be checked against the
tenantId the Authorizer asserted.
"""

import pytest

import utils


@pytest.mark.parametrize('shard_id', ['tenant-a-1', 'tenant-a-9'])
def test_a_tenant_may_use_its_own_partitions(shard_id):
    utils.validate_shard_belongs_to_tenant('tenant-a', shard_id)


@pytest.mark.parametrize('shard_id', ['tenant-b-1', 'other-3'])
def test_a_tenant_may_not_use_another_tenants_partitions(shard_id):
    with pytest.raises(PermissionError):
        utils.validate_shard_belongs_to_tenant('tenant-a', shard_id)


def test_a_tenant_whose_name_prefixes_another_is_still_kept_out():
    """The reason this check splits on the last '-' instead of prefix matching.

    Tenant 'acme' must not reach tenant 'acme-corp'. Both
    shard_id.startswith('acme-') and an IAM dynamodb:LeadingKeys condition of
    'acme-*' would allow 'acme-corp-3', because both are plain prefix tests.
    """
    utils.validate_shard_belongs_to_tenant('acme-corp', 'acme-corp-3')

    with pytest.raises(PermissionError):
        utils.validate_shard_belongs_to_tenant('acme', 'acme-corp-3')


def test_a_partition_key_with_no_suffix_is_rejected():
    with pytest.raises(PermissionError):
        utils.validate_shard_belongs_to_tenant('tenant-a', 'tenant-a')
