/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthConfigurationService } from '../../auth/auth-configuration.service';
import { AuthState } from '../../auth/models/auth-state.enum';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss'],
})
export class UnauthorizedComponent implements OnInit {
  tenantForm: FormGroup;
  params$: Observable<void>;
  error = false;
  errorMessage: string;

  constructor(
    private fb: FormBuilder,
    private authConfigService: AuthConfigurationService,
    private _snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    if (this.authConfigService.getAuthState() == AuthState.LoggingIn)
      this.authService.login();
  }

  ngOnInit(): void {
    this.tenantForm = this.fb.group({
      tenantName: [null, [Validators.required]],
    });
  }

  isFieldInvalid(field: string) {
    const formField = this.tenantForm.get(field);
    return (
      formField && formField.invalid && (formField.dirty || formField.touched)
    );
  }

  displayFieldCss(field: string) {
    return {
      'is-invalid': this.isFieldInvalid(field),
    };
  }

  hasRequiredError(field: string) {
    return !!this.tenantForm.get(field)?.hasError('required');
  }

  openErrorMessageSnackBar(errorMessage: string) {
    this._snackBar.open(errorMessage, 'Dismiss', {
      duration: 4 * 1000, // seconds
    });
  }

  login() {
    let tenantName = this.tenantForm.value.tenantName;
    if (!tenantName) {
      this.errorMessage = 'No tenant name provided.';
      this.error = true;
      this.openErrorMessageSnackBar(this.errorMessage);
      return false;
    }
    this.authConfigService.setTenantConfig(tenantName).subscribe({
      next: () => {
        this.authConfigService.setAuthState(AuthState.LoggingIn)
        window.location.reload()
      },
      error: (errorResponse) => {
        this.error = true;
        if (errorResponse.status && errorResponse.status == 404)
          this.errorMessage = 'Tenant not found!';
        else
          this.errorMessage = errorResponse.message || 'An unexpected error occurred!';
        this.openErrorMessageSnackBar(this.errorMessage);
      }
    })
    return false;
  }
}
