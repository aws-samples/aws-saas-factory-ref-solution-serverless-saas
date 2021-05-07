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
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { map } from 'rxjs/operators';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private secureRoutes = ['http://my.route.io/secureapi'];

  constructor(private oidcSecurityService: OidcSecurityService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      // Ensure we send the token only to routes which are secured
      // if (!this.secureRoutes.find((x) => req.url.startsWith(x))) {
      //     return next.handle(req);
      // }

      const token = this.oidcSecurityService.getIdToken();


      if (!token) {
          return next.handle(req);
      }


      req = req.clone({
          headers: req.headers.set('Authorization', 'Bearer ' + token),
      });

      return next.handle(req);
  }
}
