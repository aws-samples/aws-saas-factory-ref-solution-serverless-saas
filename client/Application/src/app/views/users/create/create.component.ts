/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../users.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  userForm: FormGroup;
  error: boolean = false;
  success: boolean = false;

  // The only two roles that exist within a tenant. The User Management API
  // enforces this too and will reject any other value; see
  // isRecognizedTenantRole in server/src/layers/auth_manager.py.
  userRoles: string[] = ['TenantAdmin', 'TenantUser'];

  constructor(
    private fb: FormBuilder,
    private userSvc: UsersService,
    private _snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      userName: [null, [Validators.required]],
      userEmail: [null, [Validators.email, Validators.required]],
      userRole: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {}

  openErrorMessageSnackBar(errorMessage: string) {
    this._snackBar.open(errorMessage, 'Dismiss', {
      duration: 4 * 1000, // seconds
    });
  }

  onSubmit() {
    const user = this.userForm.value;
    this.userSvc.create(user).subscribe(
      () => {
        this.success = true;
        this.openErrorMessageSnackBar('Successfully created new user!');
      },
      (err) => {
        this.error = true;
        // Only a tenant admin may create users, so tell the user that rather
        // than reporting an authorization decision as an unexpected failure.
        this.openErrorMessageSnackBar(
          err?.status === 403
            ? 'You are not authorized to create users for this tenant.'
            : 'An unexpected error occurred!'
        );
      }
    );
  }
}
