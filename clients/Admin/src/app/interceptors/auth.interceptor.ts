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
import { map, switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() {}
  idToken: string;

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const session$ = from(Auth.currentSession());

    return session$.pipe(
      map((sesh) => sesh.getIdToken()),
      switchMap((tok) => {
        req = req.clone({
          headers: req.headers.set(
            'Authorization',
            'Bearer ' + tok.getJwtToken()
          ),
        });
        return next.handle(req);
      })
    );
  }
}
