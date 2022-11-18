/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
export interface Product {
  key: string;
  shardId: string;
  productId: string;
  name: string;
  price: number;
  sku: string;
  category: string;
  pictureUrl?: string;
}
