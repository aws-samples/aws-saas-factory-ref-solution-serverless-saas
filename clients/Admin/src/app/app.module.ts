/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { filter } from 'rxjs/operators';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { AuthModule, EventTypes, LogLevel, OidcConfigService, PublicEventsService } from 'angular-auth-oidc-client';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};
//import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Import default-layout
import { DefaultLayoutComponent } from './default-layout';

import { P404Component } from './views/error/404.component';
import { P500Component } from './views/error/500.component';

const APP_CONTAINERS = [
  DefaultLayoutComponent
];
import {
  AppAsideModule,
  AppBreadcrumbModule,
  AppHeaderModule,
  AppFooterModule,
  AppSidebarModule,
} from '@coreui/angular';
// Import routing module
import { AppRoutingModule } from './app-routing.module';

// Import 3rd party components
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ChartsModule } from 'ng2-charts';
import { HttpClientModule } from '@angular/common/http';
import { configureAuth } from './views/auth/configure-auth';
import { UnauthorizedComponent } from './views/error/unauthorized.component';
import { httpInterceptorProviders } from './interceptors';

@NgModule({
  imports: [
    AppAsideModule,
    AppBreadcrumbModule.forRoot(),
    AppFooterModule,
    AppHeaderModule,
    AppRoutingModule,
    AppSidebarModule,
    AuthModule.forRoot(),
    BrowserAnimationsModule,
    BrowserModule,
    BsDropdownModule.forRoot(),
    ChartsModule,
    HttpClientModule,
    PerfectScrollbarModule,
    TabsModule.forRoot(),
  ],
  declarations: [
    AppComponent,
    ...APP_CONTAINERS,
    P404Component,
    P500Component,
    UnauthorizedComponent,
  ],

  providers: [
    OidcConfigService,
    {
        provide: APP_INITIALIZER,
        useFactory: configureAuth,
        deps: [OidcConfigService],
        multi: true,
    },
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    HttpClientModule,
    httpInterceptorProviders,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private readonly eventService: PublicEventsService) {
    this.eventService
        .registerForEvents()
        .pipe(filter((notification) => notification.type === EventTypes.ConfigLoaded))
        .subscribe((config) => {
            console.log('ConfigLoaded', config);
        });
  }
}
