/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { Auth } from 'aws-amplify';
import { filter, map, switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() {}
  idToken = '';

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.includes('tenant/init')) {
      return next.handle(req);
    }

    const s = Auth.currentSession().catch((err) => console.log(err));
    const session$ = from(s);

    return session$.pipe(
      filter((sesh) => !!sesh),
      map((sesh) => (!!sesh ? sesh.getIdToken().getJwtToken() : '')),
      switchMap((tok) => {
        req = req.clone({
          headers: req.headers.set('Authorization', 'Bearer ' + tok),
        });
        return next.handle(req);
      })
    );
  }
}
