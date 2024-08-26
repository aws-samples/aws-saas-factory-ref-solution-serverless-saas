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
import {
  HttpClient,
  HttpParams,
  HttpParamsOptions,
} from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { map, switchMap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigParams } from './models/config-params';
import { ActivatedRoute } from '@angular/router';
import Amplify from 'aws-amplify';
import { Auth } from 'aws-amplify';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthConfigurationService {
  params$: Observable<string>;
  params: ConfigParams;
  tenantName: string;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  public setTenantConfig(tenantName: string): Promise<any> {
    const url = `${environment.regApiGatewayUrl}/tenant-config/` + tenantName;
    this.params$ = this.http.get<string>(url);
    const setup$ = this.params$.pipe(
      map((val:unknown) => {
        // remove trailing slash (/) if present
        console.log("setTenantConfig val: ", val);
        this.params = val as ConfigParams;
        this.params.apiGatewayUrl = this.params.apiGatewayUrl.replace(
          /\/$/,
          ''
        );
        localStorage.setItem('userPoolId', this.params.userPoolId);
        localStorage.setItem('tenantName', tenantName);
        localStorage.setItem('appClientId', this.params.appClientId);
        localStorage.setItem('apiGatewayUrl', this.params.apiGatewayUrl);
        return 'success';
      }),
      catchError((error) => {
        console.log('Error setting tenant config: ', error);
        return throwError(error);
      })
    );

    return setup$.toPromise();
  }

  configureAmplifyAuth(): boolean {
    try {
      const userPoolId = localStorage.getItem('userPoolId');
      const appClientId = localStorage.getItem('appClientId');

      if (!userPoolId || !appClientId) {
        return false;
      }
      const region = userPoolId?.split('_')[0];
      const awsmobile = {
        aws_project_region: region,
        aws_cognito_region: region,
        aws_user_pools_id: userPoolId,
        aws_user_pools_web_client_id: appClientId,
      };

      Amplify.configure(awsmobile);
      return true;
    } catch (err) {
      console.error('Unable to initialize amplify auth.', err);
      return false;
    }
  }

  cleanLocalStorage() {
    localStorage.removeItem('tenantName');
    localStorage.removeItem('userPoolId');
    localStorage.removeItem('appClientId');
    localStorage.removeItem('apiGatewayUrl');
  }
}
