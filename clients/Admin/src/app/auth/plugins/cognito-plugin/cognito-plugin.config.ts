/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { AuthProviders } from "../../auth-providers.enum";
import { AuthPluginConfig } from '../../provider-plugin.interface';

export const cognitoProviderConfig: AuthPluginConfig = {
  provider: AuthProviders.Sample,
  claimsMap: [{
    attribute: "UserName",
    claim: "username"
  },
  {
    attribute: "Email",
    claim: "email"
  },
  {
    attribute: "CompanyName",
    claim: "custom:company-name"
  }]
}
