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
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthConfigurationService } from './../auth/auth-configuration.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: [ './unauthorized.component.scss'  ]
})
export class UnauthorizedComponent implements OnInit {
  tenantForm: FormGroup;
  params$: Observable<void>;
  error = false;
  errorMessage : string;

  constructor(private oidcSecurityService: OidcSecurityService, private fb: FormBuilder,
    private authConfigService: AuthConfigurationService,
    private router: Router) {
    this.tenantForm = this.fb.group({
      tenantName: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
  }

  isFieldInvalid(field: string) {
    const formField = this.tenantForm.get(field);
    return formField.invalid && (formField.dirty || formField.touched);
  }

  displayFieldCss(field: string) {
    return {
      'is-invalid': this.isFieldInvalid(field),
    };
  }

  hasRequiredError(field: string) {
    return this.hasError(field, 'required');
  }

  hasError(field: string, error: any) {
    const formField = this.tenantForm.get(field);
    return !!formField.errors[error];
  }


  login() {

    let tenantName = this.tenantForm.value.tenantName;
    this.authConfigService.setTenantConfig(tenantName)
     .then((val)=>{
      this.oidcSecurityService.authorize();

    }).catch((errorResponse) => {
      this.error = true;
      this.errorMessage = errorResponse.error.message;

    });

    return false;
  }



}
