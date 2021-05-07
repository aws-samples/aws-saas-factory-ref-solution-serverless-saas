import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import {HttpClient} from '@angular/common/http';
import { env } from 'process';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { navItems } from '../_nav';
import {OpenIdConfigParams} from './models/openid-config-params'

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html'
})
export class DefaultLayoutComponent implements OnInit {
  public sidebarMinimized = false;
  public navItems = navItems;
  isAuthenticated$: Observable<Boolean>;
  username$: Observable<string>;

  constructor(public oidcSecurityService: OidcSecurityService,
              private http: HttpClient,
              private router: Router) {}

  ngOnInit() {
    this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
    this.username$ = this.oidcSecurityService.userData$.pipe(
      map(ud => ud?.email)
    );
  }

  toggleMinimize(e) {
    this.sidebarMinimized = e;
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    //this.oidcSecurityService.userData$.subscribe((val) => console.log(val));
    this.oidcSecurityService.logoffAndRevokeTokens()
    //.subscribe(() => {});
    this.oidcSecurityService.logoff();
    // const match = environment.issuer.match(/(?!\.)([\w-]+)(?=\.amazonaws)/);
    // const region = !!match ? match[0] : '';
    // window.location.href = `https://${environment.domain}.auth.${region}.amazoncognito.com/login?client_id=${environment.clientId}&response_type=code&redirect_uri=http://localhost:4200`;

    const stsServer = `${environment.issuer}`;
    const logoutUrl = `${window.location.origin}/`;

    this.http.get<OpenIdConfigParams>(stsServer+"/.well-known/openid-configuration")
    .subscribe((openIdConfigParams) => {
      const url = openIdConfigParams.authorization_endpoint.replace("oauth2/authorize", "");
      window.location.href = url+`logout?client_id=${environment.clientId}&logout_uri=${logoutUrl}`;
    })
    return;

  }
}

