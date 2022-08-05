import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  submitting: boolean = false;
  tenantForm: FormGroup = this.fb.group({
    tenantName: ['', [Validators.required]],
    tenantEmail: ['', [Validators.email, Validators.required]],
    tenantTier: ['', [Validators.required]],
    tenantPhone: [''],
    tenantAddress: [''],
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private _snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {}

  openErrorMessageSnackBar(errorMessage: string) {
    this._snackBar.open(errorMessage, 'Dismiss', {
      duration: 4 * 1000, // seconds
    });
  }

  submit() {
    this.submitting = true;
    const tenant = {
      ...this.tenantForm.value,
    };
    this.http
      .post(`${environment.registrationApiUrl}/registration`, tenant)
      .subscribe({
        next: () => {
          this.openErrorMessageSnackBar('Successfully created new tenant!');
          this.tenantForm.reset();
          this.submitting = false;
        },
        error: (err) => {
          this.openErrorMessageSnackBar('An unexpected error occurred!');
          console.error(err);
          this.submitting = false;
        },
      });
  }
}
