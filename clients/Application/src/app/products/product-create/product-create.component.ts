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
import { Router } from '@angular/router';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-product-create',
  templateUrl: './product-create.component.html',
  styles: [],
})
export class ProductCreateComponent implements OnInit {
  constructor(
    private router: Router,
    private productSvc: ProductService,
    private fb: FormBuilder
  ) {}
  productForm: FormGroup;
  files: File[];
  categories: string[] = ['category1', 'category2', 'category3', 'category4'];

  ngOnInit(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', Validators.required],
      sku: ['', Validators.required],
      category: ['', Validators.required],
      pictureUrl: '',
    });
  }

  submit() {
    this.productSvc.post(this.productForm.value).subscribe(() => {
      this.router.navigate(['products']);
    }, (err) => {
      alert(err);
      console.error(err);
    });
  }

  cancel() {
    this.router.navigate(['products']);
  }

}
