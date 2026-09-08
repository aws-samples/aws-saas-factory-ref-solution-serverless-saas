import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { IdentityProvider } from '../lib/tenant-template/identity-provider';

/*
 * Any attribute listed in a user pool client's WriteAttributes can be changed by
 * the signed-in user themselves, using nothing but their own access token and
 * Cognito's UpdateUserAttributes API. That path never reaches our API Gateway or
 * Lambda functions, so no amount of authorization in the User Management service
 * can constrain it.
 *
 * custom:userRole, custom:tenantId and custom:tenantTier are all read by
 * tenant_authorizer.py to decide which tenant's data a caller may reach, so they
 * must not be self-service writable.
 */
describe('tenant user pool client attribute permissions', () => {
  const template = () => {
    const stack = new cdk.Stack();
    new IdentityProvider(stack, 'TestIdentityProvider', { tenantId: 'unittest' });
    return Template.fromStack(stack);
  };

  test('only email is writable by the user themselves', () => {
    template().hasResourceProperties('AWS::Cognito::UserPoolClient', {
      WriteAttributes: Match.arrayEquals(['email']),
    });
  });

  test('no authorization attribute is writable by the user themselves', () => {
    const client = Object.values(
      template().findResources('AWS::Cognito::UserPoolClient')
    )[0];
    const writeAttributes: string[] = client.Properties.WriteAttributes;

    for (const attribute of [
      'custom:userRole',
      'custom:tenantId',
      'custom:tenantTier',
      'custom:apiKey',
    ]) {
      expect(writeAttributes).not.toContain(attribute);
    }
  });
});
