#!/bin/bash -e

echo "$(date) cleaning up Auth0 resources..."

aws ssm delete-parameter \
    --name "Serverless-SaaS-Auth0-Domain"

aws ssm delete-parameter \
    --name "Serverless-SaaS-Auth0-ClientId"

aws ssm delete-parameter \
    --name "Serverless-SaaS-Auth0-ClientSecret"