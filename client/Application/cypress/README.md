# Application End-to-End Testing

## Instructions

To run End-to-End (e2e) tests against the Sample Application, take the following steps:

1. Make a copy of the example env file (`cypress.env.json.example`):

```bash
cp cypress.env.json.example cypress.env.json
```

2. Edit the new file and replace the sample values with real values.

3. Navigate to the root of the Application project (`aws-saas-factory-ref-solution-serverless-saas/clients/Application/`) and run the following:

```bash
npx cypress run
```

This will run the tests located in the `cypress/e2e` folder.

The documentation [here](https://docs.cypress.io/guides/guides/command-line#cypress-run) has more information on what can be passed in as arguments when running the Cypress tests.

For example, running the following will show the Cypress UI and what is happening as each of the tests are run:

```bash
npx cypress run --headed
```
