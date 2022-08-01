/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Auth } from 'aws-amplify';
import { AuthConfigurationService } from './views/auth/auth-configuration.service';

@Injectable({ providedIn: 'root' })
export class CognitoGuard implements CanActivate {
  constructor(
    private router: Router,
    private authConfigService: AuthConfigurationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    if (!this.authConfigService.configureAmplifyAuth()) {
      this.authConfigService.cleanLocalStorage();
      this.router.navigate(['/unauthorized']);
      return new Promise<boolean>((res, rej) => {
        res(false);
      });
    }

    return Auth.currentSession()
      .then((u) => {
        if (u.isValid()) {
          return true;
        } else {
          this.authConfigService.cleanLocalStorage();
          this.router.navigate(['/unauthorized']);
          return false;
        }
      })
      .catch((e) => {
        if (state.url === '/dashboard') {
          // if we're going to the dashboard and we're not logged in,
          // don't stop the flow as the amplify-authenticator will
          // route requests going to the dashboard to the sign-in page.
          return new Promise<boolean>((res, rej) => {
            res(true);
          });
        }

        console.log('Error getting current session', e);
        return false;
      });
  }
}
