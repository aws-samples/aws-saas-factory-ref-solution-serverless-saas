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
import { UsersService } from '../users.service';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styles: [
  ]
})
export class UserCreateComponent implements OnInit {
  userForm: FormGroup;
  error: boolean = false;
  success: boolean = false;

  constructor(private fb: FormBuilder, private userSvc: UsersService) {

    this.userForm = this.fb.group({
      userName: [null, [Validators.required]],
      userEmail: [null, [Validators.email, Validators.required]],
      userRole: [null,[Validators.required]]
    });
  }

  ngOnInit(): void {
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
    const user = this.userForm.value;
    this.userSvc.create(user)
    .subscribe(() => this.success = true, (err) => this.error = true);
  }
}
