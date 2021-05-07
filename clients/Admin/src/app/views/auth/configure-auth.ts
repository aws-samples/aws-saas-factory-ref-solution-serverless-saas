import { LogLevel, OidcConfigService } from 'angular-auth-oidc-client';
import { environment } from '../../../environments/environment';


export function configureAuth(oidcConfigService: OidcConfigService) {
  const issuer = environment.issuer;
  const clientId = environment.clientId;
  return () =>
      oidcConfigService.withConfig({
          stsServer: issuer,
          redirectUrl: `${window.location.origin}/`,
          postLogoutRedirectUri: `${window.location.origin}/signout`,
          clientId: clientId,
          scope: 'openid profile email',
          responseType: 'code',
          useRefreshToken: true,
          autoUserinfo: false,
          logLevel: LogLevel.Debug,
      });
}
