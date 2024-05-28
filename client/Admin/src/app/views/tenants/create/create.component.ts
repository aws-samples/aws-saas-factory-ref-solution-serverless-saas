import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantsService } from '../tenants.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  submitting = false;
  tenantForm: FormGroup = this.fb.group({
    tenantName: [null, [Validators.required]],
    email: [null, [Validators.email, Validators.required]],
    tier: [null, [Validators.required]],
    tenantPhone: [null],
    tenantAddress: [null],
  });

  constructor(
    private fb: FormBuilder,
    private tenantSvc: TenantsService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  openErrorMessageSnackBar(errorMessage: string) {
    this._snackBar.open(errorMessage, 'Dismiss', {
      duration: 4 * 1000, // seconds
    });
  }

  submit() {
    this.submitting = true;
    const data = {
      ...this.tenantForm.value,
      tenantStatus: 'In progress',
    };

    this.tenantSvc.post(data).subscribe({
      next: () => {
        this.submitting = false;
        this.openErrorMessageSnackBar('Successfully created new tenant!');
        this.router.navigate(['tenants']);
      },
      error: (err) => {
        this.submitting = false;
        this.openErrorMessageSnackBar('An unexpected error occurred!');
        console.error(err);
      },
    });
  }
}
