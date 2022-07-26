/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tenant } from './models/tenant';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  constructor(private http: HttpClient) {}
  baseUrl = `${environment.apiUrl}`;
  tenantsApiUrl = `${this.baseUrl}/tenants`;
  registrationApiUrl = `${this.baseUrl}/registration`;

  // TODO strongly-type these anys as tenants once we dial in what the tenant call should return
  getTenants(): Observable<any[]> {
    return this.http.get<any[]>(this.tenantsApiUrl);
  }

  createTenant(tenant: any): Observable<any[]> {
    return this.http.post<any[]>(this.registrationApiUrl, tenant);
  }
}
