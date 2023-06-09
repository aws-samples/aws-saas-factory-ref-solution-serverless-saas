export const environment = {
  production: false,
  regApiGatewayUrl: 'https://vweis3cx6c.execute-api.eu-west-1.amazonaws.com/prod',
  auth: [{
    provider: "Cognito",
    useIdTokenForAuthorization: true,
    claimsMap: [{
      claim: "UserName",
      name: "username"
    },
    {
      claim: "Email",
      name: "email"
    },
    {
      claim: "CompanyName",
      name: "custom:company-name"
    }]
  },
  {
    provider: "Auth0",
    claimsMap: [{
      claim: "UserName",
      name: "name"
    },
    {
      claim: "Email",
      name: "name"
    },
    {
      claim: "CompanyName",
      name: "https://companyName"
    }]
  }]
};
