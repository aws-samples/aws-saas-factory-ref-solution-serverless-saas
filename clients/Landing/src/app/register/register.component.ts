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
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  error = false;
  success = false;

  constructor(private fb: FormBuilder,
              private http: HttpClient) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      tenantName: [null, [Validators.required]],
      tenantAddress: [null],
      tenantEmail: [null, [Validators.email, Validators.required]],
      tenantPhone: [null,[Validators.required]],
      tenantTier: [null, [Validators.required]],
    });
  }

  onSubmit() {
    this.form.value.tenantName = this.form.value.tenantName.replace(/\s/g, "").toLowerCase();

    const API_URL = `${environment.apiGatewayUrl}`+'registration';


    const user = {
      ...this.form.value
    };

    this.submitting = true;
    this.http.post(API_URL, user)
    .subscribe(
      val => {
        this.submitting = false;
        this.success = true;
        this.error = false;
      },
      err => {
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
