/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { NgModule } from '@angular/core';
import { AuthModule, StsConfigLoader  } from 'angular-auth-oidc-client';
import { AuthConfigurationService } from './auth-configuration.service';
import { PlugInModule } from '@auth-plugin/plugin.module'
import { PlugInConfigFactory } from '@auth-plugin/config-factory'
import { EMPTY } from 'rxjs';
import { AuthState } from './models/auth-state.enum';

export const authFactory = (pluginFactory: PlugInConfigFactory, configService: AuthConfigurationService) => {
  try {
    const config = configService.getTenantConfig()
    if (configService.getAuthState() != AuthState.NotInitialized)
      return pluginFactory.authFactory(config)
    return EMPTY
  }
  catch (error) {
    console.log("Error building config: ", error)
    configService.setAuthState(AuthState.NotInitialized)
    return EMPTY
  }
};

@NgModule({
  imports: [PlugInModule,
    AuthModule.forRoot({
    loader: {
      provide: StsConfigLoader,
      useFactory: authFactory,
      deps: [PlugInConfigFactory, AuthConfigurationService],
    },
  }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
