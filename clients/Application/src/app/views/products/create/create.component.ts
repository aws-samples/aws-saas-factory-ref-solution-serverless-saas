import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ProductService } from '../product.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  productForm: FormGroup;
  categories: string[] = ['category1', 'category2', 'category3', 'category4'];
  constructor(
    private fb: FormBuilder,
    private productSvc: ProductService,
    private router: Router
  ) {
    this.productForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', Validators.required],
      sku: '',
      category: '',
    });
  }

  get name() {
    return this.productForm.get('name');
  }

  get price() {
    return this.productForm.get('price');
  }

  submit() {
    this.productSvc.post(this.productForm.value).subscribe({
      next: () => this.router.navigate(['products']),
      error: (err) => {
        alert(err.message);
        console.error(err);
      },
    });
  }

  cancel() {
    this.router.navigate(['products']);
  }
}
