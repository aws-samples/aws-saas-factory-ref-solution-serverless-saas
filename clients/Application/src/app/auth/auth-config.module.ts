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
import { NgModule } from '@angular/core';
import { AuthModule, StsConfigHttpLoader, StsConfigLoader  } from 'angular-auth-oidc-client';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthConfigurationService, TenantConfig, AuthProviders } from './auth-configuration.service';

export const authConfigFactory = (authService: AuthConfigurationService) => {
  const config$ = of(authService.getTenantConfig())
    .pipe(
      map((config: TenantConfig) => {
        return {
          authority: config.authority,
          clientId: config.clientId,
          redirectUrl: window.location.origin,
          scope: 'openid profile',
          responseType: 'code',
          useRefreshToken: true,
          postLogoutRedirectUri: window.location.origin,
          ...(config.provider == AuthProviders.Auth0 && { customParamsAuthRequest: {
            organization: config.orgId
          }}),
          postLoginRoute: "/dashboard"
        };
      })
    )
  return new StsConfigHttpLoader(config$);
};

@NgModule({
  imports: [AuthModule.forRoot({
    loader: {
      provide: StsConfigLoader,
      useFactory: authConfigFactory,
      deps: [AuthConfigurationService],
    },
  }),],
  exports: [AuthModule],
})
export class AuthConfigModule {}
