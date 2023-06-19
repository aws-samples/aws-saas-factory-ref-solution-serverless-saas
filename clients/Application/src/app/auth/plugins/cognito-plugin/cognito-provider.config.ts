/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { AuthProviders } from "../../models/auth-providers.enum";
import { AuthPluginConfig } from '../../interface/provider-plugin.interface'

export const cognitoProviderConfig: AuthPluginConfig = {
  provider: AuthProviders.Cognito,
  useIdTokenForAuthorization: true,
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
