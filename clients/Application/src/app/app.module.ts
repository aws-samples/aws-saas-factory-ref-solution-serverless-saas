import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UnauthorizedComponent } from './views/error/unauthorized.component';

import { map, shareReplay, switchMap } from 'rxjs/operators';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ConfigAssetLoaderService } from 'config-asset-loader';
import { NavComponent } from './nav/nav.component';
import { Amplify } from 'aws-amplify';
import { AuthComponent } from './views/auth/auth.component';
import { httpInterceptorProviders } from './interceptors';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import {
  MatFormFieldModule,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    AuthComponent,
    UnauthorizedComponent,
  ],
  imports: [
    AmplifyAuthenticatorModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    LayoutModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatToolbarModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatTableModule,
  ],
  providers: [
    ConfigAssetLoaderService,
    HttpClientModule,
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: InitAuthSettings,
    //   deps: [HttpClient],
    //   multi: true,
    // },
    httpInterceptorProviders,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function InitAuthSettings(http: HttpClient) {
  console.log('In INITAUTHSETTINGS');
  return () => {
    return http.get<Configuration>('./assets/config/config.json').pipe(
      switchMap((config) => {
        console.log('CONFIG: ', JSON.stringify(config));
        const apiUrl = `${config.apiUrl}/api/tenants/auth-info`;
        return http.get<AuthInfo>(apiUrl);
      }),
      map((authInfo) => {
        console.log(authInfo);
        Amplify.configure(authInfo);
      }),
      shareReplay(1)
    );
  };
}

interface Configuration {
  apiUrl: string;
  stage: string;
}

export interface AuthInfo {
  aws_project_region: string;
  aws_cognito_region: string;
  aws_user_pools_id: string;
  aws_user_pools_web_client_id: string;
}
