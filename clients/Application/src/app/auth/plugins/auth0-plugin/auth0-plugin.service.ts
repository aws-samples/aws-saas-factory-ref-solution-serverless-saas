/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import { IdentityProviderPlugin } from '../../interface/provider-plugin.interface'
import { auth0PluginConfig } from './auth0-plugin.config'
import { StsConfigStaticLoader } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export default class Auth0PlugInService implements IdentityProviderPlugin {
  public authFactory = (config: any) => {
    const authority = __getAuth0Authority(config)
    return new StsConfigStaticLoader ({
      authority: authority,
      clientId: config.idpDetails.idp.clientId,
      redirectUrl: window.location.origin,
      scope: 'openid profile',
      responseType: 'code',
      useRefreshToken: true,
      postLogoutRedirectUri: window.location.origin,
      postLoginRoute: "/dashboard",
      customParamsAuthRequest: {
        organization: config.idpDetails.idp.orgId
      }
    });
  };

  public validateConfig = (config: any) => {
    try {
      return config.idpDetails.idp.domain
        && config.idpDetails.idp.clientId
        && config.idpDetails.idp.orgId;
    }
    catch (error) {
      return false;
    }
  }

  public getConfig = () => {
    return auth0PluginConfig;
  }
}

const __getAuth0Authority = (config: any) => {
  return `https://${config.idpDetails.idp.domain}`;
}
