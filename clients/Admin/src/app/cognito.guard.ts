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
import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CognitoGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    function getResolvedUrl(route: ActivatedRouteSnapshot): string {
      return route.pathFromRoot
        .map((v) => v.url.map((segment) => segment.toString()).join(''))
        .join('/');
    }

    return from(Auth.currentSession()).pipe(
      map((sesh) => {
        const isAuthorized = sesh.isValid();
        console.log(
          'AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized
        );
        if (!isAuthorized) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        return true;
      })
    );
  }
}
