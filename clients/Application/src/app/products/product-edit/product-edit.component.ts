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
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Product } from '../models/product.interface';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  styles: [
  ]
})
export class ProductEditComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              private router: Router,
              private productSvc: ProductService,
              private fb: FormBuilder) { }
  productForm: FormGroup;
  product$: Observable<Product>;
  key$: Observable<string>;
  files: File[];


  ngOnInit(): void {
    this.key$ = this.route.params.pipe(
      map(p => p.key)
    );

    this.product$ = this.key$.pipe(
      switchMap(p => this.productSvc.get(p))
    );

    this.productForm = this.fb.group({
      key: [''],
      productId: [''],
      name: [''],
      price: [''],
      sku: [''],
      category:['']
    });

    // Is this right? Seems like I should be able to feed the form an observable
    this.product$.subscribe(val => {
      this.productForm.patchValue({
        ...val
      });

    });

  }

  submit() {
    this.productSvc.put(this.productForm.value).subscribe(() => {
      this.router.navigate(['products']);
    }, (err) => {
      alert(err);
      console.error(err);
    });
  }

  delete() {
    this.productSvc.delete(this.productForm.value).subscribe(() => {
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
