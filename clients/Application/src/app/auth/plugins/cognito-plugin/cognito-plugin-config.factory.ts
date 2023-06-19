/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import { IdentityProviderPlugin } from '../../interface/provider-plugin.interface'
import { cognitoProviderConfig } from '../cognito-plugin/cognito-provider.config'

@Injectable({
  providedIn: 'root'
})
export class CognitoPlugInService implements IdentityProviderPlugin {
  public authFactory = (config: any) => {
    const authority = __getCognitoAuthority(config.idpDetails.idp.userPoolId)
    const client = config.idpDetails.idp.appClientId
    return {
      authority: authority,
      clientId: client,
      redirectUrl: `${window.location.origin}/`,
      scope: 'openid profile',
      responseType: 'code',
      useRefreshToken: true,
      postLogoutRedirectUri: `${window.location.origin}/`,
      postLoginRoute: "/dashboard"
    };
  };

  public validateConfig = (config: any) => {
    try {
      return config.idpDetails.idp.userPoolId
        && config.idpDetails.idp.appClientId
    }
    catch (error) {
      return false;
    }
  }

  public getConfig = () => {
    return cognitoProviderConfig
  }
}

const __getCognitoAuthority = (UserPoolId: string) => {
  const region = UserPoolId.substring(0, UserPoolId.indexOf("_"));
  return `https://cognito-idp.${region}.amazonaws.com/${UserPoolId}`;
}
