import { InjectionToken } from '@angular/core';
import { AuthProviders } from '../models/auth-providers.enum';
import { StsConfigLoader } from 'angular-auth-oidc-client'

export const IDENTITY_PLUGIN = new InjectionToken<IdentityProviderPlugin>('IdentityProviderPlugin');

export interface IdentityProviderPlugin {
  authFactory: (config: any) => StsConfigLoader
  validateConfig: (config: any) => boolean
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
