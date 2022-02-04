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
import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AuthConfigurationService } from '../views/auth/auth-configuration.service';
import { navItems } from '../_nav';

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html'
})
export class DefaultLayoutComponent implements OnInit {
  public sidebarMinimized = false;
  public navItems = navItems;
  isAuthenticated$: Observable<Boolean>;
  username$: Observable<string>;
  constructor(public oidcSecurityService: OidcSecurityService,
              private authService: AuthConfigurationService,
              private router: Router) {}



  ngOnInit() {
    this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
    this.username$ = this.oidcSecurityService.userData$.pipe(
      map(ud => ud['email'])
    );
  }

  login() {
    this.router.navigate(['/unauthorized']);
  }

  logout() {
    this.oidcSecurityService.logoffAndRevokeTokens()
    //.subscribe(() => {});

    this.oidcSecurityService.logoff();
    this.authService.LogOutOfCognito();
    // const navDetails: string [] = ['/dashboard'];
    // this.router.navigate(navDetails);
    //.subscribe(() => {});
  }

  toggleMinimize(e) {
    this.sidebarMinimized = e;
  }
}
