import { Observable, pipe, map, catchError } from 'rxjs';
import { withLatestFrom } from "rxjs/operators";
import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { AuthConfigurationService, AuthProviders, AuthState } from './auth-configuration.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private oidcSecurityService: OidcSecurityService,
    private authConfigService: AuthConfigurationService
    ) {}

  get isAuthenticated$(): Observable<boolean> {
    return this.oidcSecurityService.isAuthenticated$.pipe(map((result) => result.isAuthenticated));
  }

  get accessToken$(): Observable<string> {
    return this.oidcSecurityService.getAccessToken();
  }

  get idToken$(): Observable<string> {
    return this.oidcSecurityService.getIdToken();
  }

  get token$(): Observable<string> {
    return this.__getProviderTokenOverride()
      ? this.oidcSecurityService.getIdToken()
      : this.oidcSecurityService.getAccessToken()
  }

  private __getProviderTokenOverride() : boolean {
    const config = this.authConfigService.getTenantConfig();
    return environment.auth.find(el => el.provider == config.provider)?.useIdTokenForAuthorization || false;
  }

  get userData$(): Observable<any> {
    return this.oidcSecurityService.userData$.pipe(
      map((data) => data.userData),
      catchError(() => ("Error getting userData")))
  }

  checkAuth() {
    return this.oidcSecurityService.checkAuth();
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    const config = this.authConfigService.getTenantConfig();
    if (config.provider == AuthProviders.Cognito) {
      this.__cognito_logout();
    }
    else {
      this.oidcSecurityService.logoff().subscribe((result) => console.log(result));
    }
    this.authConfigService.setAuthState(AuthState.LoggedOut);
  }

  private __cognito_logout() {
    this.oidcSecurityService.logoffLocal();
    this.oidcSecurityService.getConfiguration().subscribe((config) => {
      this.oidcSecurityService.getAuthorizeUrl().subscribe((url) => {
        if (url) {
          const urlObj = new URL(url)
          const urlParams = new URLSearchParams(urlObj.search);
          const clientId = urlParams.get('client_id');
          location.href = `${urlObj.origin}/logout?client_id=${clientId}&logout_uri=${config.postLogoutRedirectUri}`
        }
        else {
          console.error("Cannot logout from provider - unable to create logout URL")
        }
      })
    })
  }

  get companyName$(): Observable<string> {
    return this.oidcSecurityService.userData$.pipe(
      withLatestFrom(this.oidcSecurityService.userData$),
      map(([, data]) => data.userData[this.__getClaimName("CompanyName")]),
      catchError(() => ("Error getting company name")))
  }

  get userName$(): Observable<string> {
    return this.oidcSecurityService.userData$.pipe(
      withLatestFrom(this.oidcSecurityService.userData$),
      map(([, data]) => data.userData[this.__getClaimName("Email")]),
      catchError((err) => ("Error getting user name")))
  }

  private __getClaimName(claim: string) : string {
    const config = this.authConfigService.getTenantConfig();
    return environment.auth.find(el => el.provider == config.provider)?.claimsMap.find(el => el.claim == claim)?.name || ""
  }
}
