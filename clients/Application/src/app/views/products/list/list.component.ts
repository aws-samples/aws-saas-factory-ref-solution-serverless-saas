import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product.interface';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  products$: Observable<Product[]>;
  displayedColumns: string[] = ['name', 'price', 'description'];

  constructor(private productSvc: ProductService, private router: Router) {
    this.products$ = new Observable<Product[]>();
  }

  ngOnInit(): void {
    this.refresh();
  }

  onEdit(product: Product) {
    this.router.navigate(['products', 'edit', product.productId]);
    return false;
  }

  onRemove(product: Product) {
    this.productSvc.delete(product);
    this.refresh();
  }

  onCreate() {
    this.router.navigate(['products', 'create']);
  }

  refresh() {
    this.products$ = this.productSvc.fetch();
  }
}
