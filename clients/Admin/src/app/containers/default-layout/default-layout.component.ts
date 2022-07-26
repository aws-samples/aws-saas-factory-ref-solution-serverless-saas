/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from 'aws-amplify';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { navItems } from '../../_nav';

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
})
export class DefaultLayoutComponent implements OnInit {
  public sidebarMinimized = false;
  public navItems = navItems;
  isAuthenticated$: Observable<Boolean>;
  username$: Observable<string>;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const session$ = from(Auth.currentSession());
    this.isAuthenticated$ = session$.pipe(map((sesh) => sesh.isValid()));
    this.username$ = session$.pipe(
      map((sesh) => sesh.getAccessToken().payload.email)
    );
  }

  toggleMinimize(e): void {
    this.sidebarMinimized = e;
  }

  logout(): void {
    Auth.signOut();
  }
}
