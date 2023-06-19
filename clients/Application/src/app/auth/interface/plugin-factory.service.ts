import { Injectable } from '@angular/core';
import { IdentityProviderPlugin } from './provider-plugin.interface';

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
      return import('../plugins/sample-plugin/sample-plugin-config.factory').then((module) => {
        this.pluginInstance = new module.default();
        return this.pluginInstance;
      });
    }
  }
}
