/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { UserListComponent } from './user-list/user-list.component';
import { UserCreateComponent } from './user-create/user-create.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertModule } from 'ngx-bootstrap/alert';

@NgModule({
  declarations: [UserListComponent, UserCreateComponent, UserDetailComponent],
  imports: [
    AlertModule.forRoot(),
    CommonModule,
    UsersRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class UsersModule {}
