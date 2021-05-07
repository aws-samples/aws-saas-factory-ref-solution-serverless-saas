import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Pipeline from '../lib/serverless-saas-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Pipeline.ServerlessSaaSStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
