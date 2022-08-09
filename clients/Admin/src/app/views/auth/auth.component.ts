import { Component, OnInit } from '@angular/core';
import { from, Observable, pipe } from 'rxjs';
import { Auth } from 'aws-amplify';
import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { map } from 'rxjs/operators';

@Component({
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  session$: Observable<CognitoUserSession> | undefined;
  userData$: Observable<any> | undefined;
  isAuthenticated$: Observable<boolean> | undefined;
  checkSessionChanged$: Observable<boolean> | undefined;
  idToken$: Observable<string> | undefined;
  accessToken$: Observable<string> | undefined;
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

  async logout() {
    await Auth.signOut({ global: true });
  }
}
