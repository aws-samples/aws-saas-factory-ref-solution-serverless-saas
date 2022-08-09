import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../models/product.interface';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  productData: Product[] = [];
  isLoading: boolean = true;
  displayedColumns: string[] = ['name', 'price', 'description'];

  constructor(private productSvc: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.productSvc.fetch().subscribe((data) => {
      this.productData = data;
      this.isLoading = false;
    });
  }

  onEdit(product: Product) {
    this.router.navigate(['products', 'edit', product.productId]);
    return false;
  }

  onRemove(product: Product) {
    this.productSvc.delete(product);
    this.isLoading = true;
    this.productSvc.fetch().subscribe((data) => {
      this.productData = data;
      this.isLoading = false;
    });
  }

  onCreate() {
    this.router.navigate(['products', 'create']);
  }
}
