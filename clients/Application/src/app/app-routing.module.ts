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
import { RouterModule, Routes } from '@angular/router';
import { NavComponent } from './nav/nav.component';
import { AuthComponent } from './views/auth/auth.component';
import { UnauthorizedComponent } from './views/error/unauthorized.component';
import { AuthGuard } from './auth/auth.guard';
import { LoginCallbackComponent } from './auth/login-callback.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '', component: NavComponent, canActivate: [AuthGuard], data: { title: 'Home', },
  children: [
    { path: 'auth/info', component: AuthComponent },
    { path: 'dashboard', loadChildren: () => import('./views/dashboard/dashboard.module').then((m) => m.DashboardModule)},
    { path: 'orders', loadChildren: () => import('./views/orders/orders.module').then((m) => m.OrdersModule)},
    { path: 'products', loadChildren: () => import('./views/products/products.module').then((m) => m.ProductsModule)},
    { path: 'users', loadChildren: () => import('./views/users/users.module').then((m) => m.UsersModule)},
  ]},
  { path: 'unauthorized', component: UnauthorizedComponent},
  { path: 'login', component: LoginCallbackComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
