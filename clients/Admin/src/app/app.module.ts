import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpInterceptorProviders } from './interceptors';

import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { NavComponent } from './nav/nav.component';
import { AuthComponent } from './views/auth/auth.component';

@NgModule({
  declarations: [AppComponent, NavComponent, AuthComponent],
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
  ],
  providers: [
    HttpClientModule,
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    HttpClientModule,
    HttpInterceptorProviders,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
