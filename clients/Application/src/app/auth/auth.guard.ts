/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthConfigurationService } from './auth-configuration.service';
import { AuthState } from './models/auth-state.enum';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private authConfigService: AuthConfigurationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.authService.isAuthenticated$.pipe(map((isAuthenticated) => {
      if (isAuthenticated)
        return true;

      if (this.authConfigService.getAuthState() == AuthState.LoggingIn) //login callback
        return this.router.createUrlTree(['login']);

      return this.router.createUrlTree(['unauthorized']);
    }))
  }
}
