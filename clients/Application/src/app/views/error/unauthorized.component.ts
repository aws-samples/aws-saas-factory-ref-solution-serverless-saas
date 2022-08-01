/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthConfigurationService } from './../auth/auth-configuration.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tenantForm = this.fb.group({
      tenantName: [null, [Validators.required]],
    });

    if (localStorage.getItem('tenantName')) {
      this.router.navigate(['/dashboard']);
    }
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

    this.authConfigService
      .setTenantConfig(tenantName)
      .then((val) => {
        this.router.navigate(['/dashboard']);
      })
      .catch((errorResponse) => {
        this.error = true;
        this.errorMessage = errorResponse.error.message;
        this.openErrorMessageSnackBar(this.errorMessage);
      });

    return false;
  }
}
