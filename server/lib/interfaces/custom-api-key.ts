// This interface is used instead of simply using the ApiKey class because
// it allows downstream classes to read the value of the ApiKey.
// more info: https://stackoverflow.com/questions/66142536/cdk-how-to-get-apigateway-key-value-ie-x-api-key-20-chars
export interface CustomApiKey {
  value: string;
  apiKeyId: string;
}
