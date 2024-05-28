/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  productForm: FormGroup;
  categories: string[] = ['category1', 'category2', 'category3', 'category4'];
  product$: Observable<Product | undefined> | undefined;
  productId$: Observable<string> | undefined;
  productName$: Observable<string | undefined> | undefined;

  constructor(
    private fb: FormBuilder,
    private productSvc: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      shardId: [],
      productId: [],
      name: ['', Validators.required],
      price: ['', Validators.required],
      sku: '',
      category: '',
    });

    this.productId$ = this.route.params.pipe(map((p) => p['productId']));
    this.product$ = this.productId$.pipe(
      switchMap((p) => this.productSvc.get(p))
    );
    this.productName$ = this.product$.pipe(map((p) => p?.name));

    this.product$.subscribe((val) => {
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
    this.productSvc.put(this.productForm?.value).subscribe({
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
