import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Order } from '../models/order.interface';
import { OrdersService } from '../orders.service';
import { first } from 'rxjs';
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
    this.orderSvc.fetch().subscribe((s) => {
      this.isLoading = false;
      this.orderData = s;
    });
  }

  sum(order: Order): number {
    return order.orderProducts
      .map((p) => p.price * p.quantity)
      .reduce((acc, curr) => acc + curr);
  }
}
