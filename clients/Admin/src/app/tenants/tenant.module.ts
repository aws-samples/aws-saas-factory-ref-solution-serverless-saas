/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { TenantRoutingModule } from './tenant-routing.module';
import { TenantListComponent } from './tenant-list.component';
import { TenantDetailComponent } from './tenant-detail.component';
import { CreateComponent } from './create.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertModule } from 'ngx-bootstrap/alert';

@NgModule({
  declarations: [TenantListComponent, TenantDetailComponent, CreateComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    TenantRoutingModule,
    AlertModule.forRoot(),
  ],
  providers: [HttpClientModule],
})
export class TenantModule {}
