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
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CognitoGuard } from '../cognito.guard';
import { OrdersCreateComponent } from './orders-create/orders-create.component';
import { OrdersDetailComponent } from './orders-detail/orders-detail.component';
import { OrdersListComponent } from './orders-list/orders-list.component';


const routes: Routes = [{
    path: '',
    redirectTo: 'list'
  },
  {
    path: 'list',
    data: {
      title: 'All Orders',
    },
    component: OrdersListComponent,
    canActivate: [CognitoGuard],
  },
  {
    path: 'create',
    data: {
      title: 'Create Order'
    },
    component: OrdersCreateComponent,
    canActivate: [CognitoGuard],
  },
  {
    path: 'detail/:key',
    data: {
      title: 'View Order Detail'
    },
    component: OrdersDetailComponent,
    canActivate: [CognitoGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
