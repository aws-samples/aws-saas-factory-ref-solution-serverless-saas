/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantService } from './tenant.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styles: [],
})
export class CreateComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  error = false;
  success = false;

  constructor(
    private fb: FormBuilder,
    private tenantSvc: TenantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tenantName: [null, [Validators.required]],
      tenantAddress: [null],
      tenantEmail: [null, [Validators.email, Validators.required]],
      tenantPhone: [null, [Validators.required]],
      tenantTier: [null, [Validators.required]],
    });
  }

  onSubmit() {
    this.submitting = true;
    const user = {
      ...this.form.value,
    };

    this.tenantSvc.createTenant(user).subscribe(
      (val) => {
        this.submitting = false;
        this.success = true;
        this.error = false;
        this.router.navigate(['tenants']);
      },
      (err) => {
        this.submitting = false;
        this.success = false;
        this.error = true;
        console.log(err);
      }
    );
  }

  isFieldInvalid(field: string) {
    const formField = this.form.get(field);
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
    const formField = this.form.get(field);
    return !!formField.errors[error];
  }
}
