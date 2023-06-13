/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { AuthProviders } from "../../models/auth-providers.enum";

export const providerConfig = {
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
