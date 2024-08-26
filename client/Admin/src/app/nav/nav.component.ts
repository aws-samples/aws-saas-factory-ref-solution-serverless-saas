import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { from, Observable, of } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

import { AuthenticatorService } from '@aws-amplify/ui-angular';
import { Auth } from 'aws-amplify';
import { navItems } from '../_nav';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent implements OnInit {
  tenantName = '';
  loading$: Observable<boolean> = of(false);
  isAuthenticated$: Observable<Boolean> | undefined;
  username$: Observable<string> | undefined;
  companyName$: Observable<string> | undefined;
  public navItems = navItems;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {
    this.loading$ = this.router.events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError
      ),
      map((e) => e instanceof NavigationStart)
    );
  }

  ngOnInit(): void {
    try {
      const s = Auth.currentSession().catch((err) => err);
      const session$ = from(s);
      this.isAuthenticated$ = session$.pipe(
        filter((sesh) => !!sesh),
        map((sesh) => sesh && sesh.isValid())
      );
      const token$ = session$.pipe(map((sesh) => sesh && sesh.getIdToken()));
      this.username$ = token$.pipe(
        map((t) => t && t.payload['cognito:username'])
      );
      this.companyName$ = token$.pipe(
        map((t) => t.payload['custom:company-name'])
      );
    } catch (err) {
      console.error('Unable to get current session.');
    }
  }
}
