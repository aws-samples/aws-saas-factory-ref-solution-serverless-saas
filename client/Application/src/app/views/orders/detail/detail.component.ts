/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Order } from '../models/order.interface';
import { OrderProduct } from '../models/orderproduct.interface';
import { OrdersService } from '../orders.service';
@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit {
  orderId$: Observable<string> | undefined;
  order$: Observable<Order> | undefined;
  orderProducts$: Observable<OrderProduct[]> | undefined;
  taxRate = 0.0899;
  constructor(private route: ActivatedRoute, private orderSvc: OrdersService) {}

  ngOnInit(): void {
    this.orderId$ = this.route.params.pipe(map((o) => o['orderId']));
    this.order$ = this.orderId$.pipe(switchMap((o) => this.orderSvc.get(o)));
    this.orderProducts$ = this.order$.pipe(map((o) => o.orderProducts));
  }

  today() {
    return new Date();
  }

  tenantName() {
    return '';
  }

  sum(op: OrderProduct) {
    return op.price * op.quantity;
  }

  tax(op: OrderProduct) {
    return this.sum(op) * this.taxRate;
  }

  total(op: OrderProduct) {
    return this.sum(op) + this.tax(op);
  }

  subTotal(order: Order) {
    return order.orderProducts
      .map((op) => op.price * op.quantity)
      .reduce((acc, curr) => acc + curr);
  }

  calcTax(order: Order) {
    return this.subTotal(order) * this.taxRate;
  }

  final(order: Order) {
    return this.subTotal(order) + this.calcTax(order);
  }
}
