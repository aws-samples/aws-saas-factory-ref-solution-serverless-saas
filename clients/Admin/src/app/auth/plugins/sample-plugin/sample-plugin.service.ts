/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import { IdentityProviderPlugin } from '../../provider-plugin.interface'
import { sampleProviderConfig } from './sample-plugin.config'
import { StsConfigStaticLoader } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export default class SamplePluginService implements IdentityProviderPlugin {
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

  public validateConfig = (config: any) => {
    return true
  }

  public getConfig = () => {
    return sampleProviderConfig
  }
}

const __getPluginConfig = () => {
  return {
    authority: 'https://dev-xeabezht.eu.auth0.com',
    clientId: 'eqhbDpnQC8zZZwW3AJYsaHcmLNSPJ4tk'
  }
}
