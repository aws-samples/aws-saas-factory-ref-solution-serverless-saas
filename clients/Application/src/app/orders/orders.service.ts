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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ServiceHelperService } from '../service-helper.service';
import { Order } from './models/order.interface';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  orders: Order[] = [];
  constructor(private http: HttpClient,
              private svcHelper: ServiceHelperService) { }

  fetch(): Observable<Order[]> {
    const url = `${this.svcHelper.getUrl('orders')}`;
    return this.http.get<Order[]>(url);
  }

  get(key: string): Observable<Order> {
    const url = `${this.svcHelper.getUrl('order')}/${key}`;
    return this.http.get<Order>(url);
  }

  create(order: Order): Observable<Order> {
    const url = `${this.svcHelper.getUrl('order')}`;
    return this.http.post<Order>(url, order);
  }

}
