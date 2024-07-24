import { IConstruct } from 'constructs';
import { CfnResource, IAspect, RemovalPolicy } from 'aws-cdk-lib';

export class DestroyPolicySetter implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnResource) {
      node.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }
  }
}
