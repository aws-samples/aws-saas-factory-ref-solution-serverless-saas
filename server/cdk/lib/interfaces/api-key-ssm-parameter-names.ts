// This interface is used to help simplify sharing the
// set of SSM parameter names between constructs and stacks.
export interface ApiKeySSMParameterNames {
  [tier: string]: {
    keyId: string;
    value: string;
  };
}
