/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginInfoComponent } from './login-info/login-info.component';

@NgModule({
  declarations: [LoginInfoComponent],
  imports: [CommonModule, AuthRoutingModule],
})
export class AuthModule {}
