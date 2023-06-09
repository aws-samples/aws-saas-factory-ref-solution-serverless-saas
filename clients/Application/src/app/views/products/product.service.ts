/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from './models/product.interface';
import { AuthConfigurationService } from '../../auth/auth-configuration.service'

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  baseUrl: string
  constructor(
    private http: HttpClient,
    private config: AuthConfigurationService) {
      this.baseUrl = this.config.getTenantApi()
    }

  fetch(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  get(productId: string): Observable<Product> {
    const url = `${this.baseUrl}/product/${productId}`;
    return this.http.get<Product>(url);
  }

  delete(product: Product) {
    const url = `${this.baseUrl}/product/${product.shardId}:${product.productId}`;
    return this.http.delete<Product>(url);
  }

  put(product: Product) {
    const url = `${this.baseUrl}/product/${product.shardId}:${product.productId}`;
    return this.http.put<Product>(url, product);
  }

  post(product: Product) {
    return this.http.post<Product>(`${this.baseUrl}/product`, product);
  }
}
