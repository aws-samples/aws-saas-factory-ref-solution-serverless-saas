/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Product } from '../models/product.interface';
import { ProductService } from '../product.service';
@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit {
  productForm: FormGroup | undefined;
  product$: Observable<Product | undefined> | undefined;
  productId$: Observable<string> | undefined;
  productName$: Observable<string | undefined> | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productSvc: ProductService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.productId$ = this.route.params.pipe(map((p) => p['productId']));
    this.product$ = this.productId$.pipe(
      switchMap((p) => this.productSvc.get(p))
    );
    this.productName$ = this.product$.pipe(map((p) => p?.name));

    this.productForm = this.fb.group({
      productId: [''],
      name: [''],
      price: [''],
      description: [''],
    });

    // Is this right? Seems like I should be able to feed the form an observable
    this.product$.subscribe((val) => {
      console.log(val);
      this.productForm?.patchValue({
        ...val,
      });
    });
  }

  get name() {
    return this.productForm?.get('name');
  }

  get price() {
    return this.productForm?.get('price');
  }

  submit() {
    this.productSvc.patch(this.productForm?.value).subscribe({
      next: () => this.router.navigate(['products']),
      error: (err) => console.error(err),
    });
  }

  delete() {
    this.productSvc.delete(this.productForm?.value).subscribe({
      next: () => this.router.navigate(['products']),
      error: (err) => {
        alert(err);
        console.error(err);
      },
    });
  }

  cancel() {
    this.router.navigate(['products']);
  }
}
