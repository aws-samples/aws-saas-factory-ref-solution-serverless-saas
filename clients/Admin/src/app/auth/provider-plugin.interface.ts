import { InjectionToken } from '@angular/core';
import { AuthProviders } from './auth-providers.enum';
import { StsConfigLoader } from 'angular-auth-oidc-client'

export const IDENTITY_PLUGIN = new InjectionToken<IdentityProviderPlugin>('IdentityProviderPlugin');

export interface IdentityProviderPlugin {
  authFactory: () => StsConfigLoader
  getConfig: () => AuthPluginConfig
}

export interface AuthPluginConfig {
  provider: AuthProviders,
  useIdTokenForAuthorization?: boolean
  claimsMap: ClaimsMap
}

interface ClaimsMap extends Array<ClaimMapItem>{}

interface ClaimMapItem {
  attribute: string;
  claim: string;
}
