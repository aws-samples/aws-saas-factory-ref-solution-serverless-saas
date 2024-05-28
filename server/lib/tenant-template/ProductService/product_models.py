# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

class Product:
    key =''
    def __init__(self, shardId, productId, sku, name, price, category):
        self.shardId = shardId
        self.productId = productId
        self.key = shardId + ':' +  productId
        self.sku = sku
        self.name = name
        self.price = price
        self.category = category

class Category:
    def __init__(self, id, name):
        self.id = id
        self.name = name
                

        

               

        
