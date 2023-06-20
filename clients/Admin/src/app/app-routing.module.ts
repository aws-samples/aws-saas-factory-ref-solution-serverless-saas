import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavComponent } from './nav/nav.component';
import { AuthComponent } from './views/auth/auth.component';
import { AutoLoginAllRoutesGuard } from 'angular-auth-oidc-client';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '', component: NavComponent, data: { title: 'Home' }, canActivate: [AutoLoginAllRoutesGuard],
    children: [
      { path: 'auth/info', component: AuthComponent },
      { path: 'dashboard', loadChildren: () => import('./views/dashboard/dashboard.module').then((m) => m.DashboardModule)},
      { path: 'tenants', loadChildren: () => import('./views/tenants/tenants.module').then((m) => m.TenantsModule)},
      { path: 'users', loadChildren: () => import('./views/users/users.module').then((m) => m.UsersModule) },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
