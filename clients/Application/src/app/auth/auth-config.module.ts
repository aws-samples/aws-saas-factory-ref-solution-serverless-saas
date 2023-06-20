/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AuthModule, StsConfigLoader } from 'angular-auth-oidc-client';
import { AuthConfigurationService } from './auth-configuration.service';
import { EMPTY } from 'rxjs';
import { AuthState } from './models/auth-state.enum';
import { IdentityProviderPlugin, IDENTITY_PLUGIN } from './interface/provider-plugin.interface';
import { PluginFactoryService } from './interface/plugin-factory.service';

export const authFactory = (pluginFactory: IdentityProviderPlugin, configService: AuthConfigurationService) => {
  try {
    const config = configService.getTenantConfig()
    if (configService.getAuthState() != AuthState.NotInitialized)
      return pluginFactory.authFactory(config)
    return EMPTY //does not initialize config
  }
  catch (error) {
    console.log("Error building config: ", error)
    configService.setAuthState(AuthState.NotInitialized)
    return EMPTY //does not initialize config
  }
};

@NgModule({
  imports: [AuthModule.forRoot({
    loader: {
      provide: StsConfigLoader,
      useFactory: authFactory,
      deps: [IDENTITY_PLUGIN, AuthConfigurationService]
    }
  })],
  exports: [AuthModule],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: pluginFactory,
    deps: [PluginFactoryService],
    multi: true
  },
  {
    provide: IDENTITY_PLUGIN,
    useFactory: pluginInstance,
    deps: [PluginFactoryService]
  }]
})
export class AuthConfigModule {}

export function pluginFactory(pluginService: PluginFactoryService): () => Promise<IdentityProviderPlugin> {
  return () => pluginService.getPluginInstance();
}

export function pluginInstance(pluginService: PluginFactoryService): () => IdentityProviderPlugin {
  return pluginService.pluginInstance;
}
