/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styles: [],
})
export class UserCreateComponent implements OnInit {
  userForm: FormGroup;
  error: boolean = false;
  success: boolean = false;

  constructor(private fb: FormBuilder, private userSvc: UsersService) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      userName: [null, [Validators.required]],
      userEmail: [null, [Validators.email, Validators.required]],
      tenantId: [null, [Validators.required]],
      userRole: [null, [Validators.required]],
    });
  }

  isFieldInvalid(field: string) {
    const formField = this.userForm.get(field);
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
    const formField = this.userForm.get(field);
    return !!formField.errors[error];
  }

  onSubmit() {
    this.userForm.value.tenantId = this.userForm.value.tenantId.trim();
    const user = {
      ...this.userForm.value,
    };
    this.userSvc.create(user).subscribe(
      (val) => {
        this.success = true;
        this.error = false;
      },
      (err) => {
        this.success = false;
        this.error = true;
        console.log(err);
      }
    );
  }
}
