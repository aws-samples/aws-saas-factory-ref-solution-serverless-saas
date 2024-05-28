import * as cdk from 'aws-cdk-lib';
import { CfnOutput, StackProps } from "aws-cdk-lib";
import { Construct } from 'constructs';
import { ClientInterface } from './client-interface'

interface ClientTemplateStackProps extends StackProps {
  apiUrl: string;
  userPoolId: string;
  appClientId: string;
  region: string;
}

export class ClientTemplateStack extends cdk.Stack {
  public readonly adminClient: ClientInterface;
  public readonly appClient: ClientInterface;

  constructor(scope: Construct, id: string, props: ClientTemplateStackProps) {
    super(scope, id, props);

    this.adminClient = new ClientInterface(
      this,
      "AdminClientInterface",
      {
        directoryName: 'Admin',
        clientConfig: {
          production: true,
          apiUrl: props.apiUrl,
          userPoolId: props.userPoolId,
          appClientId: props.appClientId,
          region: props.region,
        }
      }
    );

    this.appClient = new ClientInterface(
      this,
      "AppClientInterface",
      {
        directoryName: 'Application',
        clientConfig: {
          production: true,
          regApiGatewayUrl: props.apiUrl,
        }
      }
    );

    new CfnOutput(this, "adminSiteUrl", {
      value: this.adminClient.webDistribution.distributionDomainName,
    });
    new CfnOutput(this, "appSiteUrl", {
      value: this.appClient.webDistribution.distributionDomainName,
    });
  }
}
