/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { Tenant } from './models/tenant';

@Injectable({
  providedIn: 'root',
})
export class TenantsService {
  constructor(private http: HttpClient) {}
  baseUrl = `${environment.apiUrl}`;
  tenantsApiUrl = `${this.baseUrl}/tenants`;
  registrationApiUrl = `${this.baseUrl}/registration`;

  // TODO strongly-type these anys as tenants once we dial in what the tenant call should return
  fetch(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(this.tenantsApiUrl);
  }

  post(tenant: Tenant): Observable<Tenant[]> {
    return this.http.post<Tenant[]>(this.registrationApiUrl, tenant);
  }
}
