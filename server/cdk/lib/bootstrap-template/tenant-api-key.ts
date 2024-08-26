import { Construct } from 'constructs';
import { ApiKey } from 'aws-cdk-lib/aws-apigateway';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

interface TenantApiKeyProps {
  apiKeyValue: string;
  ssmParameterApiKeyIdName: string;
  ssmParameterApiValueName: string;
}

export class TenantApiKey extends Construct {
  constructor(scope: Construct, id: string, props: TenantApiKeyProps) {
    super(scope, id);

    const apiKey = new ApiKey(this, 'apiKey', {
      value: props.apiKeyValue,
    });
    new StringParameter(this, `apiKeyId`, {
      parameterName: props.ssmParameterApiKeyIdName,
      stringValue: apiKey.keyId,
    });

    new StringParameter(this, 'apiKeyValue', {
      parameterName: props.ssmParameterApiValueName,
      stringValue: props.apiKeyValue,
    });
  }
}
