import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Order } from '../models/order.interface';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'lineItems', 'total'];
  orders$ = new Observable<Order[]>();
  constructor(private orderSvc: OrdersService, private router: Router) {}

  ngOnInit(): void {
    this.orders$ = this.orderSvc.fetch();
  }

  sum(order: Order): number {
    return order.orderProducts
      .map((p) => p.price * p.quantity)
      .reduce((acc, curr) => acc + curr);
  }
}
