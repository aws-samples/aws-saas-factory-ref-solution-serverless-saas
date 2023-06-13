/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './auth/auth.service';
import { AuthConfigurationService } from './auth/auth-configuration.service'
import { AuthState } from './auth/models/auth-state.enum';

@Component({
  selector: 'app-root',
  template: ` <router-outlet></router-outlet> `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private authService: AuthService,
    private authConfigurationService: AuthConfigurationService,
  ) {
    this.matIconRegistry.addSvgIcon(
      'saas-commerce',
      this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/logo.svg')
    );
  }
  title = 'application';

  ngOnInit() {
    //only check authentication if Auth is initialized
    if (this.authConfigurationService.getAuthState() != AuthState.NotInitialized) {
      this.authService.checkAuth().subscribe(({ isAuthenticated }) => {
        if (isAuthenticated) {
          this.authConfigurationService.setAuthState(AuthState.LoggedIn)
        }
      });
    }
  }
}
