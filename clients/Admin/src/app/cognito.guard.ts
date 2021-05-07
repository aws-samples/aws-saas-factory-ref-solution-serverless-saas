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
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CognitoGuard implements CanActivate {
    constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

      function getResolvedUrl(route: ActivatedRouteSnapshot): string {
        var path: string = route.pathFromRoot
                           .map(v => v.url.map(segment => segment.toString()).join(''))
                           .join('/');
        //console.log("path:"+path);
        return path;
      }
      return this.oidcSecurityService.isAuthenticated$.pipe(
          map((isAuthorized: boolean) => {
              console.log('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);
              if (!isAuthorized) {
                  this.router.navigate(['/unauthorized']);
                  return false;
              }

              return true;
          })
      );
    }
}
