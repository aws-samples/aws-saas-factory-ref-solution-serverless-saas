#!/bin/bash -e

echo "To setup your Auth0 integration, please follow the steps below:
1. Go to \"Applications\" -> \"Applications\" and click on \"+ Create Application\".
2. Enter as \"Name\": \"SaaS Management M2M\", select \"Machine to Machine Applications\" and click on \"Create\".
3. Select \"Auth0 Management API\" and select \"All\" Permissions (for production, select only the scopes that are required).
4. Click on \"Authorize\"
5. Switch to the tab \"Settings\" and copy the values of \"Domain\", \"Client ID\" and \"Client Secret\".

Please enter your Auth0 domain (e.g., my-domain.eu.auth0.com):"
read -r AUTH0_DOMAIN
echo "Please enter your Auth0 client ID:"
read -r AUTH0_CLIENT_ID
echo "Please enter your Auth0 client secret:"
read -r AUTH0_CLIENT_SECRET

echo "Please confirm your selection:"
echo "Auth0 domain: $AUTH0_DOMAIN"
echo "Auth0 client ID: $AUTH0_CLIENT_ID"
echo "Auth0 client secret: [**************]"
select yc in "Confirm" "Cancel"; do
    case $yc in
        Confirm)
            break
            ;;
        Cancel)
            exit
            ;;
        *)
            echo "Invalid option. Please select a valid option."
            ;;
    esac
done

aws ssm put-parameter \
    --name "Serverless-SaaS-Auth0-Domain" \
    --value "$AUTH0_DOMAIN" \
    --type String

aws ssm put-parameter \
    --name "Serverless-SaaS-Auth0-ClientId" \
    --value "$AUTH0_CLIENT_ID" \
    --type String

aws ssm put-parameter \
    --name "Serverless-SaaS-Auth0-ClientSecret" \
    --value "$AUTH0_CLIENT_SECRET" \
    --type SecureString

echo "Auth0 Idp SSM parameters configured"