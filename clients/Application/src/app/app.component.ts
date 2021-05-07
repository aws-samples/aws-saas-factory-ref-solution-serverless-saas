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
import { Router, NavigationEnd } from '@angular/router';
import {
  OidcSecurityService,
  PublicEventsService,
  EventTypes,
} from 'angular-auth-oidc-client';
import { tap, filter } from 'rxjs/operators';
import {AuthConfigurationService} from './views/auth/auth-configuration.service';

@Component({
  selector: 'body',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    public oidcSecurityService: OidcSecurityService,
    private eventService: PublicEventsService,
    private authConfigService: AuthConfigurationService
  ) {}

  ngOnInit() {
    this.authConfigService.setOidcConfig();

    this.oidcSecurityService
      .checkAuth()
      .subscribe((isAuthenticated) => {
          console.log('app authenticated', isAuthenticated);

        }
      );

    this.eventService
      .registerForEvents()
      .pipe(
        tap((x) => console.log('Notif:', x)),
        filter(
          (notification) =>
            notification.type === EventTypes.CheckSessionReceived
        )
      )
      .subscribe((value) =>
        console.log('CheckSessionReceived with value from app', value)
      );

    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0);
    });
  }

}
