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
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { LocationStrategy, HashLocationStrategy, PathLocationStrategy } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { OidcConfigService, AuthModule } from 'angular-auth-oidc-client';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
// RECOMMENDED
import { CarouselModule } from 'ngx-bootstrap/carousel';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

import { AppComponent } from './app.component';

// Import containers
import { DefaultLayoutComponent } from './default-layout';

import { P404Component } from './views/error/404.component';
import { P500Component } from './views/error/500.component';
import { LogoffComponent } from './views/logoff/logoff.component';


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
import { AppRoutingModule } from './app.routing';

// Import 3rd party components
import { AlertModule } from 'ngx-bootstrap/alert';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ChartsModule } from 'ng2-charts';
import { HttpClient } from '@angular/common/http';
import { configureAuth } from './views/auth/auth-config';
import { UnauthorizedComponent } from './views/error/unauthorized.component';
import { httpInterceptorProviders } from './interceptors';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthConfigurationService } from './views/auth/auth-configuration.service';


@NgModule({
  imports: [
    AlertModule.forRoot(),
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
    CarouselModule.forRoot(),
    ChartsModule,
    CollapseModule.forRoot(),
    FormsModule,
    PerfectScrollbarModule,
    ReactiveFormsModule,
    TabsModule.forRoot(),
  ],
  declarations: [
    ...APP_CONTAINERS,
    AppComponent,
    LogoffComponent,
    P404Component,
    P500Component,
    UnauthorizedComponent,
  ],
  providers: [
    HttpClient,
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    OidcConfigService,
    httpInterceptorProviders,
    AuthConfigurationService,
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
