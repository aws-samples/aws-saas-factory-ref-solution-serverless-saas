import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginInfoComponent } from './login-info/login-info.component';


const routes: Routes = [
  {
    path: 'info',
    component: LoginInfoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
