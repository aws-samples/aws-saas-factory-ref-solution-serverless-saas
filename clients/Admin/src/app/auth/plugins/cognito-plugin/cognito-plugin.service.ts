/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import { IdentityProviderPlugin } from '../../provider-plugin.interface'
import { cognitoProviderConfig } from './cognito-plugin.config'
import { StsConfigStaticLoader } from 'angular-auth-oidc-client';
import config from '../../../../environments/auth-config.js'

@Injectable({
  providedIn: 'root'
})
export default class CognitoPluginService implements IdentityProviderPlugin {
  public authFactory = () => {
    const config = __getPluginConfig();
    return new StsConfigStaticLoader ({
      authority: config.authority,
      clientId: config.clientId,
      redirectUrl: `${window.location.origin}/`,
      scope: 'openid profile',
      responseType: 'code',
      useRefreshToken: true,
      postLogoutRedirectUri: window.location.origin,
      postLoginRoute: "/dashboard"
    })
  }

  public getConfig = () => {
    return cognitoProviderConfig
  }
}

const __getPluginConfig = () => {
  const userPoolId = Object.getOwnPropertyDescriptor(config, 'userPoolId')?.value || undefined;
  const appClientIed = Object.getOwnPropertyDescriptor(config, 'appClientId')?.value || undefined;
  if (userPoolId && appClientIed) {
    const region = userPoolId.substring(0, userPoolId.indexOf("_"));
    return {
      authority: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      clientId: appClientIed
    }
  }
  else {
    throw "Auth config is invalid!"
  }
}
