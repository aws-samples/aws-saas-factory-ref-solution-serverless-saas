/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Product } from '../../products/models/product.interface';
import { ProductService } from '../../products/product.service';
import { Order } from '../models/order.interface';
import { OrdersService } from '../orders.service';

interface LineItem {
  product: Product;
  quantity?: number;
}

@Component({
  selector: 'app-orders-create',
  templateUrl: './orders-create.component.html',
  styles: [
    '.dottedUnderline { border-bottom: 1px dotted; }',
  ]
})
export class OrdersCreateComponent implements OnInit {
  orderForm: FormGroup;
  orderProducts: LineItem[] = [];
  error: string;

  constructor(private fb: FormBuilder,
              private router: Router,
              private productSvc: ProductService,
              private orderSvc: OrdersService) { }

  ngOnInit(): void {
    this.productSvc.fetch().subscribe(products => {
      this.orderProducts = products.map(p => (
        { product: p }
      ));
    })
    this.orderForm = this.fb.group({
      orderName: ['', Validators.required],
    });
  }

  add(op: LineItem) {
    const orderProduct = this.orderProducts.find(p => p?.product.productId  === op.product.productId);
    this.orderProducts = this.orderProducts.map(p => {
      if (p.product?.productId === orderProduct.product?.productId) {
        p = {
          ...orderProduct,
          quantity: orderProduct.quantity ? orderProduct.quantity + 1 : 1,
        };
      }
      return p;
    });
  }

  remove(op: LineItem) {
    const orderProduct = this.orderProducts.find(p => p?.product.productId  === op.product.productId);
    this.orderProducts = this.orderProducts.map(p => {
      if (p.product?.productId === orderProduct.product?.productId) {
        p = {
          ...orderProduct,
          quantity: orderProduct.quantity && orderProduct.quantity > 1 ?
                      orderProduct.quantity - 1 : undefined,
        };
      }
      return p;
    });
  }

  submit() {
    const val: Order = {
      ...this.orderForm.value,
      orderProducts: this.orderProducts
      .filter(p => !!p.quantity)
      .map(p => ({
        productId: p.product.productId,
        price: p.product.price,
        quantity: p.quantity
      })),
    };
    this.orderSvc.create(val)
      .subscribe(() => {
        this.router.navigate(['orders']);
      },
      (err: string) => {
        this.error = err;
      });
  }

  cancel() {
    this.router.navigate(['orders']);
  }

}
