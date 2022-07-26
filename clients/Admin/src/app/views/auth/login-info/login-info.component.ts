/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { from, Observable, pipe } from 'rxjs';
import { Auth } from 'aws-amplify';
import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-login-info',
  templateUrl: './login-info.component.html',
  styleUrls: ['login-info.component.scss'],
})
export class LoginInfoComponent implements OnInit {
  session$: Observable<CognitoUserSession>;
  userData$: Observable<any>;
  isAuthenticated$: Observable<boolean>;
  checkSessionChanged$: Observable<boolean>;
  idToken$: Observable<string>;
  accessToken$: Observable<string>;
  checkSessionChanged: any;

  constructor() {}

  ngOnInit(): void {
    this.session$ = from(Auth.currentSession());
    this.accessToken$ = this.session$.pipe(
      map((sesh) => sesh.getAccessToken().getJwtToken())
    );
    this.idToken$ = this.session$.pipe(
      map((sesh) => sesh.getIdToken().getJwtToken())
    );
    this.isAuthenticated$ = this.session$.pipe(map((sesh) => sesh.isValid()));
  }

  logout() {
    Auth.signOut();
  }

  async forceRefreshSession() {
    try {
      const cognitoUser = await Auth.currentAuthenticatedUser();
      const currentSession = await Auth.currentSession();
      cognitoUser.refreshSession(
        currentSession.getRefreshToken(),
        (err, session) => {
          console.log('session', err, session);
          this.accessToken$ = new Observable<string>((s) => {
            s.next(session.getAccessToken().getJwtToken());
          });

          this.idToken$ = new Observable<string>((s) => {
            s.next(session.getIdToken().getJwtToken());
          });
        }
      );
    } catch (e) {
      console.log('Unable to refresh Token', e);
    }
  }
}
