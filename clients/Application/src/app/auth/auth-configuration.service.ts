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
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthConfigurationService {
  constructor(private http: HttpClient) {}

  public setTenantConfig(tenantName: string): Observable<any> {
    const url = `${environment.regApiGatewayUrl}/tenant/init/` + tenantName;
    return this.http.get(url).pipe(
      tap((config) => {
        localStorage.setItem('SaaS-Serverless-Config.Tenant', JSON.stringify(config));
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

export enum AuthState {
  LoggedIn = "LoggedIn",            //user is authenticated
  LoggedOut = "LoggedOut",          //user is logged out and tenant config is removed
  LoggingIn = "LoggingIn",          //user is logging in (callback)
  NotInitialized = "NotInitialized" //auth has not yet been initialized
}

export class TenantConfig {
  constructor(config: any) {
    if(!Object.keys(config).length) return;
    this.provider = config["idpDetails"]["idp"]["provider"];
    this.authority = config["idpDetails"]["idp"]["authority"];
    this.clientId = config["idpDetails"]["idp"]["clientId"];
    this.apiGatewayUrl = config["apiGatewayUrl"].replace(/\/$/, ''); // remove trailing slash (/) if present
  }
  provider: string;
  authority: string;
  clientId: string;
  apiGatewayUrl: string;
  orgId: string
}

export enum AuthProviders {
  Auth0 = "Auth0",
  Cognito = "Cognito"
}
