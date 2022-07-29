/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { INavData } from './models';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    icon: 'insights',
  },
  {
    name: 'Products',
    url: '/products',
    icon: 'sell',
  },
  {
    name: 'Orders',
    url: '/orders',
    icon: 'shopping_cart',
  },
  {
    name: 'Users',
    url: '/users',
    icon: 'supervisor_account',
  },
];
