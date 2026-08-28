import { aws_cognito, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IdentityDetails } from '../interfaces/identity-details';

interface IdentityProviderStackProps extends StackProps {
  tenantId: string;
}

export class IdentityProvider extends Construct {
  public readonly tenantUserPool: aws_cognito.UserPool;
  public readonly tenantUserPoolClient: aws_cognito.UserPoolClient;
  public readonly identityDetails: IdentityDetails;
  constructor(scope: Construct, id: string, props: IdentityProviderStackProps) {
    super(scope, id);

    this.tenantUserPool = new aws_cognito.UserPool(this, 'tenantUserPool', {
      autoVerify: { email: true },
      accountRecovery: aws_cognito.AccountRecovery.EMAIL_ONLY,
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        tenantId: new aws_cognito.StringAttribute({
          mutable: true,
        }),
        userRole: new aws_cognito.StringAttribute({
          mutable: true,
        }),
        apiKey: new aws_cognito.StringAttribute({
          mutable: true,
        }),
        // adding this new custom attribute so that we can determine which API Key
        // to use without having to hit an external db in the lambda tenant_authorizer function
        tenantTier: new aws_cognito.StringAttribute({
          mutable: true,
        }),
      },
    });

    // Only email is writable by the signed-in user themselves.
    //
    // Any attribute listed here can be changed by a user with nothing but their
    // own access token, via Cognito's UpdateUserAttributes API, without going
    // anywhere near our API Gateway or Lambda functions. tenantId and userRole
    // are exactly what tenant_authorizer.py reads to decide which tenant's data
    // the caller may reach, so listing them here would let any tenant user grant
    // themselves another tenant's identity or a SaaS provider role. tenantTier
    // selects the API key and usage plan, so a user could otherwise award
    // themselves a higher throughput tier. They are changed only through the
    // User Management API, which uses the admin side AdminUpdateUserAttributes
    // call and enforces role based authorization. apiKey has no legitimate
    // self-service writer either.
    const writeAttributes = new aws_cognito.ClientAttributes().withStandardAttributes({
      email: true,
    });

    this.tenantUserPoolClient = new aws_cognito.UserPoolClient(this, 'tenantUserPoolClient', {
      userPool: this.tenantUserPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        adminUserPassword: false,
        userSrp: true,
        custom: false,
      },
      writeAttributes: writeAttributes,
      oAuth: {
        scopes: [
          aws_cognito.OAuthScope.EMAIL,
          aws_cognito.OAuthScope.OPENID,
          aws_cognito.OAuthScope.PROFILE,
        ],
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
      },
    });

    this.identityDetails = {
      name: 'Cognito',
      details: {
        userPoolId: this.tenantUserPool.userPoolId,
        appClientId: this.tenantUserPoolClient.userPoolClientId,
      },
    };
  }
}
