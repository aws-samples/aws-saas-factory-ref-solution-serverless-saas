import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../models/order.interface';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'lineItems', 'total'];
  orderData: Order[] = [];
  isLoading: boolean = true;
  constructor(private orderSvc: OrdersService, private router: Router) {}

  ngOnInit(): void {
    this.orderSvc.fetch().subscribe((data) => {
      this.isLoading = false;
      this.orderData = data;
    });
  }

  sum(order: Order): number {
    return order.orderProducts
      .map((p) => p.price * p.quantity)
      .reduce((acc, curr) => acc + curr);
  }
}
