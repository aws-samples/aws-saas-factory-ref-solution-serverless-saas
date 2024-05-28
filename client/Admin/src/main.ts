import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Amplify } from 'aws-amplify';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

const amplifyConfig = {
  aws_project_region: `${environment.region}`,
  aws_cognito_region: `${environment.region}`,
  aws_user_pools_id: `${environment.userPoolId}`,
  aws_user_pools_web_client_id: `${environment.appClientId}`,
};
Amplify.configure(amplifyConfig);

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
