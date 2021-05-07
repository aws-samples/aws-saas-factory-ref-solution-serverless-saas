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
import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import {throwError} from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigParams } from './models/config-params';
import { OpenIdConfigParams } from './models/openid-config-params';
import { ActivatedRoute } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthConfigurationService {
  params$: Observable<ConfigParams>;
  params: ConfigParams;
  tenantName: string;



  constructor(private oidcConfigService: OidcConfigService,
    private oidcSecurityService: OidcSecurityService,
    private http: HttpClient,
    private route: ActivatedRoute) {

    }




  public ConfigureDummy() {

    return () =>
      this.oidcConfigService.withConfig({
        stsServer: '<enter cognito userpool url>',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: `${window.location.origin}/signout`,
        clientId: '<enter client id>',
        scope: 'openid profile email phone',
        responseType: 'code',
        //silentRenew: true,
        //silentRenewUrl: `${window.location.origin}/silent-renew.html`,
        useRefreshToken: true,
        autoUserinfo: false,
        logLevel: LogLevel.Debug,
    });

  }


  public Configure() {
      const setupAction$ = this.params$.pipe(
        map((customConfig) => {
            return {
                stsServer: customConfig.issuer,
                redirectUrl: customConfig.redirectUri,
                clientId: customConfig.clientId,
                responseType: customConfig.responseType,
                scope: customConfig.scope,
                postLogoutRedirectUri: `${window.location.origin}/signout`,
                startCheckSession: customConfig.start_checksession,
                silentRenew: false, // customConfig.useSilentRefresh,
                silentRenewUrl: customConfig.silentRefreshRedirectUri,
                postLoginRoute: '',
                forbiddenRoute: '/forbidden',
                unauthorizedRoute: '/unauthorized',
                logLevel: LogLevel.Debug,
                maxIdTokenIatOffsetAllowedInSeconds: 10,
                historyCleanupOff: true,
                useRefreshToken: true,
                autoUserinfo: false,
                cognitoDomain: customConfig.cognitoDomain || 'https://saascoffeekincorqobl.auth.us-east-1.amazoncognito.com',
            };
        }),
        switchMap((config) => this.oidcConfigService.withConfig(config))
    );
    return () => setupAction$.toPromise();

  }

  public LogOutOfCognito(): Observable<any> {
    let appClientId = localStorage.getItem('appClientId');
    let userPoolId = localStorage.getItem('userPoolId');
    let region = userPoolId.split('_')[0];

    const stsServer = `https://cognito-idp.${region}.amazonaws.com/`+userPoolId;
    const clientId = appClientId;
    const logoutUrl = `${window.location.origin}/`;

    this.http.get<OpenIdConfigParams>(stsServer+"/.well-known/openid-configuration")
    .subscribe((openIdConfigParams) => {
      const url = openIdConfigParams.authorization_endpoint.replace("oauth2/authorize", "");
      window.location.href = url+`logout?client_id=${clientId}&logout_uri=${logoutUrl}`;
    })
    return;
  }

  public setTenantConfig(tenantName: string): Promise<any> {
    const url = `${environment.regApiGatewayUrl}/tenant/init/`+tenantName;
    this.params$ = this.http.get<ConfigParams>(url);

    const setup$ =this.params$.pipe(
      map((val) => {

        localStorage.setItem('userPoolId',val.userPoolId);
        localStorage.setItem('appClientId',val.appClientId);
        localStorage.setItem('apiGatewayUrl',val.apiGatewayUrl);
        this.setOidcConfig();
        return "success";

      }),
      catchError((error) => {
        console.log(error)
        return throwError(error);
      })
    );


      return setup$.toPromise();

  }

  public setOidcConfig() {
    let appClientId = localStorage.getItem('appClientId');
    let userPoolId = localStorage.getItem('userPoolId');

    if(this.isValid(appClientId)
    && this.isValid(userPoolId)) {
      let region = userPoolId.split('_')[0];
      console.log(window.location.origin);

          this.oidcConfigService.withConfig({
            stsServer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
            redirectUrl: `${window.location.origin}/`,
            clientId: appClientId,
            responseType: 'code',
            scope: 'openid profile email',
            postLogoutRedirectUri: `${window.location.origin}/signout`,
            silentRenew: false, // customConfig.useSilentRefresh,
            postLoginRoute: '',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            logLevel: LogLevel.Debug,
            maxIdTokenIatOffsetAllowedInSeconds: 10,
            historyCleanupOff: true,
            useRefreshToken: true,
            autoUserinfo: false,

          });

        }

  }

  private isValid(input: string) {

    return input != null
    && input != ''
    && input != 'undefined';

  }
}
