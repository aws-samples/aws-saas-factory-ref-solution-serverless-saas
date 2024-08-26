/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
export interface User {
  email: string;
  created?: string;
  modified?: string;
  enabled?: boolean;
  status?: string;
  verified?: boolean;
  role?: string;
  username?: string;
}
