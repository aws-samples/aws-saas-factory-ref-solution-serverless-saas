import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { map, shareReplay } from 'rxjs/operators';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ConfigAssetLoaderService } from 'config-asset-loader';
import { RegisterComponent } from './views/register/register.component';
import { LandingComponent } from './views/landing/landing.component';

import { environment } from 'src/environments/environment';

@NgModule({
  declarations: [AppComponent, LandingComponent, RegisterComponent],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  providers: [
    ConfigAssetLoaderService,
    HttpClientModule,
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: InitAuthSettings,
      deps: [HttpClient],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function InitAuthSettings(http: HttpClient) {
  console.log('IN INIT AUTH SETTINGS');
  return () => {
    return http.get<Configuration>('./assets/config/config.json').pipe(
      map((config) => {
        environment.registrationApiUrl = config.registrationApiUrl;
      }),
      shareReplay(1)
    );
  };
}

interface Configuration {
  registrationApiUrl: string;
  stage: string;
}
