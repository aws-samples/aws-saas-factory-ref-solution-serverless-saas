/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { NgModule } from '@angular/core';
import { PlugInConfigFactory } from './config-factory'

@NgModule({
  providers: [PlugInConfigFactory]
})
export class PlugInModule { }
