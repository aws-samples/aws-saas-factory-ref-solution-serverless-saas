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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ServiceHelperService } from '../service-helper.service';
import { Product } from './models/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient,
    private svcHelper: ServiceHelperService) { }

  fetch(): Observable<Product[]> {
    const url = `${this.svcHelper.getUrl('products')}`;
    return this.http.get<Product[]>(url);
  }

  get(key: string): Observable<Product> {
    const url = `${this.svcHelper.getUrl('product')}/${key}`;
    return this.http.get<Product>(url);

  }

  delete(product: Product) {
    const url = `${this.svcHelper.getUrl('product')}/${product.key}`;
    return this.http.delete<Product>(url);
  }

  put(product: Product) {
    const url = `${this.svcHelper.getUrl('product')}/${product.key}`;
    return this.http.put<Product>(url, product);
  }

  post(product: Product) {
    const url = `${this.svcHelper.getUrl('product')}/`;
    return this.http.post<Product>(url, product);
  }
}
