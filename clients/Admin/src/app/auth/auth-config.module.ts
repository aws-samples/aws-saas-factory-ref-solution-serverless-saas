/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AuthModule, StsConfigLoader } from 'angular-auth-oidc-client';
import { EMPTY } from 'rxjs';
import { IdentityProviderPlugin, IDENTITY_PLUGIN } from './provider-plugin.interface';
import { PluginFactoryService } from './plugin-factory.service';

export const authFactory = (pluginFactory: IdentityProviderPlugin) => {
  try {
    return pluginFactory.authFactory()
  }
  catch (error) {
    console.log("Error building config: ", error)
    return EMPTY //does not initialize config
  }
};

@NgModule({
  imports: [AuthModule.forRoot({
    loader: {
      provide: StsConfigLoader,
      useFactory: authFactory,
      deps: [IDENTITY_PLUGIN]
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
