/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import { IdentityProviderPlugin } from '../../interface/provider-plugin.interface'
import { sampleProviderConfig } from './sample-provider.config'

@Injectable({
  providedIn: 'root'
})
export default class SamplePluginService implements IdentityProviderPlugin {
  public authFactory = (config: any) => {
    return {
      authority: `https://dev-xeabezht.eu.auth0.com`,
      clientId: "AJXfzhbf5sP8TVQZdXMeCWQSKutpJ7hl",
      redirectUrl: window.location.origin,
      scope: 'openid profile',
      responseType: 'code',
      useRefreshToken: true,
      postLogoutRedirectUri: window.location.origin,
      postLoginRoute: "/dashboard",
      customParamsAuthRequest: {
        organization: "org_alzAMyrFVk0MsWaD"
      }
    }
  }

  public validateConfig = (config: any) => {
    return true
  }

  public getConfig = () => {
    return sampleProviderConfig
  }
}
