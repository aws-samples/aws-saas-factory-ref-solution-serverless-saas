/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Order } from './models/order.interface';
import { AuthConfigurationService } from '../../auth/auth-configuration.service'

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  orders: Order[] = [];
  baseUrl: string
  constructor(
    private http: HttpClient,
    private config: AuthConfigurationService) {
      this.baseUrl = this.config.getTenantApi()
    }

  fetch(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
  }

  get(orderId: string): Observable<Order> {
    const url = `${this.baseUrl}/order/${orderId}`;
    return this.http.get<Order>(url);
  }

  create(order: Order): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/order`, order);
  }
}
