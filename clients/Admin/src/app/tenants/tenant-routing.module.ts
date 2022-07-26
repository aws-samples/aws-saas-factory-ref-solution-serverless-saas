/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CognitoGuard } from '../cognito.guard';
import { CreateComponent } from './create.component';
import { TenantDetailComponent } from './tenant-detail.component';
import { TenantListComponent } from './tenant-list.component';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Tenant Management',
    },
    children: [
      {
        path: '',
        component: TenantListComponent,
        data: {
          title: 'Tenant List',
        },
        canActivate: [CognitoGuard],
      },
      {
        path: 'create',
        component: CreateComponent,
        data: {
          title: 'Create New Tenant',
        },
        canActivate: [CognitoGuard],
      },
      {
        path: ':id',
        component: TenantDetailComponent,
        data: {
          title: 'Tenant Detail',
        },
        canActivate: [CognitoGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TenantRoutingModule {}
