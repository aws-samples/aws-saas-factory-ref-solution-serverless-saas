/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
export enum AuthState {
  LoggedIn = "LoggedIn",            //user is authenticated
  LoggedOut = "LoggedOut",          //user is logged out and tenant config is removed
  LoggingIn = "LoggingIn",          //user is logging in (callback)
  NotInitialized = "NotInitialized" //auth has not yet been initialized
}
