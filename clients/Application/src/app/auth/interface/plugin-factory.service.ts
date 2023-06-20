import { Injectable } from '@angular/core';
import { IdentityProviderPlugin } from './provider-plugin.interface';
import { environment } from '../../../environments/environment';
import { AuthProviders } from '../models/auth-providers.enum';

@Injectable({
  providedIn: 'root',
})
export class PluginFactoryService {
  public pluginInstance: any;

  getPluginInstance(): Promise<IdentityProviderPlugin> {
    if (this.pluginInstance) {
      return Promise.resolve(this.pluginInstance);
    }
    else {
      switch (environment.auth.provider) {
        case AuthProviders.Cognito:
          return import('../plugins/cognito-plugin/cognito-plugin.service').then((module) => {
            this.pluginInstance = new module.default();
            return this.pluginInstance;
          });
        case AuthProviders.Auth0:
          return import('../plugins/auth0-plugin/auth0-plugin.service').then((module) => {
            this.pluginInstance = new module.default();
            return this.pluginInstance;
          });
        default:
          return import('../plugins/sample-plugin/sample-plugin.service').then((module) => {
            this.pluginInstance = new module.default();
            return this.pluginInstance;
          });
      }
    }
  }
}
