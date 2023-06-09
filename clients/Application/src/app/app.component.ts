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
import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './auth/auth.service';
import { AuthConfigurationService, AuthState } from './auth/auth-configuration.service'
import { OidcSecurityService  } from 'angular-auth-oidc-client';
import { PublicEventsService, EventTypes } from 'angular-auth-oidc-client';
import { pipe } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: ` <router-outlet></router-outlet> `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private authService: AuthService,
    private authConfigurationService: AuthConfigurationService,
    private oidcSecurityService: OidcSecurityService,
    private eventService: PublicEventsService
  ) {
    this.matIconRegistry.addSvgIcon(
      'saas-commerce',
      this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/logo.svg')
    );
  }
  title = 'application';

  ngOnInit() {
    //only check authentication if Auth is initialized
    if (this.authConfigurationService.getAuthState() != AuthState.NotInitialized) {
      this.authService.checkAuth().subscribe(({ isAuthenticated }) => {
        if (isAuthenticated) {
          this.authConfigurationService.setAuthState(AuthState.LoggedIn)
        }
      });
    }
  }
}
