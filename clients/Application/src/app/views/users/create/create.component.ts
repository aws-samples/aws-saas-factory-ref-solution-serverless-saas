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
  styles: [],
})
export class CreateComponent implements OnInit {
  userForm: FormGroup;
  error: boolean = false;
  success: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userSvc: UsersService,
    private _snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      email: [null, [Validators.email, Validators.required]],
    });
  }

  ngOnInit(): void {}

  isFieldInvalid(field: string) {
    const formField = this.userForm.get(field);
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
    return !!this.userForm.get(field)?.hasError('required');
  }

  openErrorMessageSnackBar(errorMessage: string) {
    this._snackBar.open(errorMessage, 'Dismiss', {
      duration: 4 * 1000, // seconds
    });
  }
  // hasError(field: string, error: any) {
  //   const formField = this.userForm.get(field);
  //   return !!formField?.errors[error];
  // }

  onSubmit() {
    const user = this.userForm.value;
    this.userSvc.create(user).subscribe(
      () => {
        this.success = true;
        this.openErrorMessageSnackBar('Sucessfully created new user!');
      },
      (err) => {
        this.error = true;
        this.openErrorMessageSnackBar('An unexpected error occurred!');
      }
    );
  }
}
