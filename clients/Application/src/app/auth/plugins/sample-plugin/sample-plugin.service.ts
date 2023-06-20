/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import { IdentityProviderPlugin } from '../../interface/provider-plugin.interface'
import { sampleProviderConfig } from './sample-plugin.config'
import { StsConfigStaticLoader } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export default class SamplePluginService implements IdentityProviderPlugin {
  public authFactory = (config: any) => {
    return new StsConfigStaticLoader ({
      authority: '',
      clientId: '',
      redirectUrl: window.location.origin,
      scope: 'openid profile',
      responseType: 'code',
      useRefreshToken: true,
      postLogoutRedirectUri: window.location.origin,
      postLoginRoute: "/dashboard",
      customParamsAuthRequest: {
        organization: ''
      }
    })
  }

  public validateConfig = (config: any) => {
    return true
  }

  public getConfig = () => {
    return sampleProviderConfig
  }
}
