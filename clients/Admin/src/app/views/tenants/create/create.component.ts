import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantService } from '../tenants.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  submitting = false;
  tenantForm: FormGroup = this.fb.group({
    tenantName: [null, [Validators.required]],
    tenantEmail: [null, [Validators.email, Validators.required]],
    tenantTier: [null, [Validators.required]],
    tenantPhone: [null],
    tenantAddress: [null],
  });

  constructor(
    private fb: FormBuilder,
    private tenantSvc: TenantService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  submit() {
    this.submitting = true;
    const user = {
      ...this.tenantForm.value,
    };

    this.tenantSvc.post(this.tenantForm.value).subscribe({
      next: () => {
        alert('created tenant!');
        this.router.navigate(['tenants']);
      },
      error: (err) => {
        alert(err.message);
        console.error(err);
      },
    });
  }
}
