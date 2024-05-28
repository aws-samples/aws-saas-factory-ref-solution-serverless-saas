import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CognitoAuth, ControlPlane } from '@cdklabs/sbt-aws';

interface ControlPlaneStackProps extends StackProps {
  controlPlaneSource: string;
  onboardingDetailType: string;
  provisioningDetailType: string;
  applicationNamePlaneSource: string;
  offboardingDetailType: string;
  idpName: string;
  systemAdminRoleName: string;
  systemAdminEmail: string;
}

export class ControlPlaneStack extends Stack {
  public readonly regApiGatewayUrl: string;
  public readonly eventBusArn: string;

  constructor(scope: Construct, id: string, props: ControlPlaneStackProps) {
    super(scope, id, props);

    const cognitoAuth = new CognitoAuth(this, 'CognitoAuth', {
      systemAdminRoleName: props.systemAdminRoleName,
      systemAdminEmail: props.systemAdminEmail,
    });

    // NOTE: To explicitly disable cloudwatch logging (and potentially save costs on CloudWatch),
    // pass the disableAPILogging flag as true
    const controlPlane = new ControlPlane(this, 'ControlPlane', {
      auth: cognitoAuth,
      //disableAPILogging: true
    });
    this.regApiGatewayUrl = controlPlane.controlPlaneAPIGatewayUrl;
  }
}
