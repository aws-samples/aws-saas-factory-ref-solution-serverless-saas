import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CognitoAuth, ControlPlane, EventManager } from '@cdklabs/sbt-aws';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Rule } from 'aws-cdk-lib/aws-events';

interface ControlPlaneStackProps extends cdk.StackProps {
  controlPlaneSource: string;
  onboardingDetailType: string;
  provisioningDetailType: string;
  applicationNamePlaneSource: string;
  offboardingDetailType: string;
  idpName: string;
  systemAdminRoleName: string;
  systemAdminEmail: string;
}

export class ControlPlaneStack extends cdk.Stack {
  public readonly regApiGatewayUrl: string;
  public readonly eventBusArn: string;

  constructor(scope: Construct, id: string, props: ControlPlaneStackProps) {
    super(scope, id, props);

    const cognitoAuth = new CognitoAuth(this, 'CognitoAuth', {
      systemAdminRoleName: props.systemAdminRoleName,
      systemAdminEmail: props.systemAdminEmail,
    });

    const eventManager = new EventManager(this, 'EventManager');

    const controlPlane = new ControlPlane(this, 'ControlPlane', {
      auth: cognitoAuth,
      eventManager: eventManager,
    });
    // for monitoring purposes
    new Rule(this, 'EventBusWatcherRule', {
      eventBus: eventManager.eventBus,
      enabled: true,
      eventPattern: {
        source: [
          controlPlane.eventManager.controlPlaneEventSource,
          controlPlane.eventManager.applicationPlaneEventSource,
        ],
      },
    });

    new LogGroup(this, 'EventBusWatcherLogGroup', {
      logGroupName: `/aws/events/EventBusWatcher-${this.node.addr}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_WEEK,
    });

    this.eventBusArn = eventManager.eventBus.eventBusArn;
    this.regApiGatewayUrl = controlPlane.controlPlaneAPIGatewayUrl;
  }
}
