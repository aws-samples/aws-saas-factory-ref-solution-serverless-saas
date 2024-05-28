/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Order } from './models/order.interface';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  orders: Order[] = [];
  baseUrl = `${localStorage.getItem('apiGatewayUrl')}/orders`;
  constructor(private http: HttpClient) {}

  fetch(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}`);
  }

  get(orderId: string): Observable<Order> {
    const url = `${this.baseUrl}/${orderId}`;
    return this.http.get<Order>(url);
  }

  create(order: Order): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}`, order);
  }
}
