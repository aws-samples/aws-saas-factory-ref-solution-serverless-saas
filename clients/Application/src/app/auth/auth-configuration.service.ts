/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthState } from './models/auth-state.enum';
import { PlugInConfigFactory } from '@auth-plugin/config-factory'
import { TenantConfig } from './models/tenant-config'

@Injectable({
  providedIn: 'root',
})
export class AuthConfigurationService {
  constructor(
    private http: HttpClient,
    private plugInConfig: PlugInConfigFactory) {}

  public setTenantConfig(tenantName: string): Observable<any> {
    const url = `${environment.regApiGatewayUrl}/tenant/init/` + tenantName;
    return this.http.get(url).pipe(
      tap((config) => {
        if (this.plugInConfig.validateConfig(config)) {
          localStorage.setItem('SaaS-Serverless-Config.Tenant', JSON.stringify(config))
        }
        else {
          console.log(config)
          throw({ message: "Invalid tenant config!" })
        }
      }),
      catchError((error) => {
        this.setAuthState(AuthState.NotInitialized)
        return throwError(() => error);
      })
    );
  }

  public getTenantConfig(): TenantConfig {
    try {
      const config = JSON.parse(localStorage.getItem('SaaS-Serverless-Config.Tenant') || '{}')
      return new TenantConfig(config);
    }
    catch {
      console.error("Unable to get tenant config")
      this.setAuthState(AuthState.NotInitialized)
      return new TenantConfig({});
    }
  }

  public clearTenantConfig() {
    localStorage.removeItem('SaaS-Serverless-Config.Tenant')
    this.setAuthState(AuthState.NotInitialized)
  }

  public getAuthState(): AuthState {
    try {
      const state: string = localStorage.getItem('SaaS-Serverless-Config.AuthState') || 'NotInitialized'
      return state as AuthState;
    }
    catch {
      this.clearTenantConfig()
      this.setAuthState(AuthState.NotInitialized)
      return AuthState.NotInitialized;
    }
  }

  public setAuthState(authState: AuthState) {
    localStorage.setItem('SaaS-Serverless-Config.AuthState', authState.toString())
  }

  public getTenantApi(): string {
    return this.getTenantConfig().apiGatewayUrl;
  }
}
