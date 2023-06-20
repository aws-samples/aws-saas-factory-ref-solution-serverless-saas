/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import { IdentityProviderPlugin } from '../../provider-plugin.interface'
import { auth0ProviderConfig } from './auth0-plugin.config'
import { StsConfigStaticLoader } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export default class Auth0PluginService implements IdentityProviderPlugin {
  public authFactory = () => {
    const config = __getPluginConfig();
    return new StsConfigStaticLoader ({
      authority: config.authority,
      clientId: config.clientId,
      redirectUrl: window.location.origin,
      scope: 'openid profile',
      responseType: 'code',
      useRefreshToken: true,
      postLogoutRedirectUri: window.location.origin,
      postLoginRoute: "/dashboard"
    })
  }

  public getConfig = () => {
    return auth0ProviderConfig
  }
}

const __getPluginConfig = () => {
  return {
    authority: '',
    clientId: ''
  }
}