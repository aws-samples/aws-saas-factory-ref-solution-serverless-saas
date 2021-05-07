# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import re
import json
import os
import urllib.request
import boto3
import time
import logger
from jose import jwk, jwt
from jose.utils import base64url_decode
import auth_manager
import utils

region = os.environ['AWS_REGION']
sts_client = boto3.client("sts", region_name=region)
dynamodb = boto3.resource('dynamodb')
table_tenant_details = dynamodb.Table('ServerlessSaaS-TenantDetails')
user_pool_operation_user = os.environ['OPERATION_USERS_USER_POOL']
app_client_operation_user = os.environ['OPERATION_USERS_APP_CLIENT']
api_key_operation_user = os.environ['OPERATION_USERS_API_KEY']

def lambda_handler(event, context):
    
    #get JWT token after Bearer from authorization
    token = event['authorizationToken'].split(" ")
    if (token[0] != 'Bearer'):
        raise Exception('Authorization header should have a format Bearer <JWT> Token')
    jwt_bearer_token = token[1]
    logger.info("Client token: " + jwt_bearer_token)
    logger.info("Method ARN: " + event['methodArn'])
    
    #only to get tenant id to get user pool info
    unauthorized_claims = jwt.get_unverified_claims(jwt_bearer_token)
    logger.info(unauthorized_claims)

    if(auth_manager.isSaaSProvider(unauthorized_claims['custom:userRole'])):
        userpool_id = user_pool_operation_user
        appclient_id = app_client_operation_user     
        api_key = api_key_operation_user         
    else:
        #get tenant user pool and app client to validate jwt token against
        tenant_details = table_tenant_details.get_item( 
            Key ={
                'tenantId': unauthorized_claims['custom:tenantId']
            }
        )
        logger.info(tenant_details)
        userpool_id = tenant_details['Item']['userPoolId']
        appclient_id = tenant_details['Item']['appClientId']
        apigateway_url = tenant_details['Item']['apiGatewayUrl']
        api_key = tenant_details['Item']['apiKey']
        

    #get keys for tenant user pool to validate
    keys_url = 'https://cognito-idp.{}.amazonaws.com/{}/.well-known/jwks.json'.format(region, userpool_id)
    with urllib.request.urlopen(keys_url) as f:
        response = f.read()
    keys = json.loads(response.decode('utf-8'))['keys']

    #authenticate against cognito user pool using the key
    response = validateJWT(jwt_bearer_token, appclient_id, keys)
    
    #get authenticated claims
    if (response == False):
        logger.error('Unauthorized')
        raise Exception('Unauthorized')
    else:
        logger.info(response)
        principal_id = response["sub"]
        user_name = response["cognito:username"]
        tenant_id = response["custom:tenantId"]
        user_role = response["custom:userRole"]
    
    
    tmp = event['methodArn'].split(':')
    api_gateway_arn_tmp = tmp[5].split('/')
    aws_account_id = tmp[4]    
    
    policy = AuthPolicy(principal_id, aws_account_id)
    policy.restApiId = api_gateway_arn_tmp[0]
    policy.region = tmp[3]
    policy.stage = api_gateway_arn_tmp[1]

    if (auth_manager.isSaaSProvider(user_role) == False):
        if (isTenantAuthorizedForThisAPI(apigateway_url, api_gateway_arn_tmp[0]) == False):
            logger.error('Unauthorized')
            raise Exception('Unauthorized')

    #roles are not fine-grained enough to allow selectively
    policy.allowAllMethods()        
    
    authResponse = policy.build()
 
    #   Generate STS credentials to be used for FGAC
    
    #   Important Note: 
    #   We are generating STS token inside Authorizer to take advantage of the caching behavior of authorizer
    #   Another option is to generate the STS token inside the lambda function itself, as mentioned in this blog post: https://aws.amazon.com/blogs/apn/isolating-saas-tenants-with-dynamically-generated-iam-policies/
    #   Finally, you can also consider creating one Authorizer per microservice in cases where you want the IAM policy specific to that service 
    
    iam_policy = auth_manager.getPolicyForUser(user_role, utils.Service_Identifier.BUSINESS_SERVICES.value, tenant_id, region, aws_account_id)
    logger.info(iam_policy)
    
    role_arn = "arn:aws:iam::{}:role/authorizer-access-role".format(aws_account_id)
    
    assumed_role = sts_client.assume_role(
        RoleArn=role_arn,
        RoleSessionName="tenant-aware-session",
        Policy=iam_policy,
    )
    credentials = assumed_role["Credentials"]

    #pass sts credentials to lambda
    context = {
        'accesskey': credentials['AccessKeyId'], # $context.authorizer.key -> value
        'secretkey' : credentials['SecretAccessKey'],
        'sessiontoken' : credentials["SessionToken"],
        'userName': user_name,
        'tenantId': tenant_id,
        'userPoolId': userpool_id,
        'apiKey': api_key,
        'userRole': user_role
    }
    
    authResponse['context'] = context
    authResponse['usageIdentifierKey'] = api_key
    logger.info(authResponse)
    
    return authResponse

def isTenantAuthorizedForThisAPI(apigateway_url, current_api_id):
    if(apigateway_url.split('.')[0] != 'https://' + current_api_id):
        return False
    else:
        return True

def validateJWT(token, app_client_id, keys):
    # get the kid from the headers prior to verification
    headers = jwt.get_unverified_headers(token)
    kid = headers['kid']
    # search for the kid in the downloaded public keys
    key_index = -1
    for i in range(len(keys)):
        if kid == keys[i]['kid']:
            key_index = i
            break
    if key_index == -1:
        logger.info('Public key not found in jwks.json')
        return False
    # construct the public key
    public_key = jwk.construct(keys[key_index])
    # get the last two sections of the token,
    # message and signature (encoded in base64)
    message, encoded_signature = str(token).rsplit('.', 1)
    # decode the signature
    decoded_signature = base64url_decode(encoded_signature.encode('utf-8'))
    # verify the signature
    if not public_key.verify(message.encode("utf8"), decoded_signature):
        logger.info('Signature verification failed')
        return False
    logger.info('Signature successfully verified')
    # since we passed the verification, we can now safely
    # use the unverified claims
    claims = jwt.get_unverified_claims(token)
    # additionally we can verify the token expiration
    if time.time() > claims['exp']:
        logger.info('Token is expired')
        return False
    # and the Audience  (use claims['client_id'] if verifying an access token)
    if claims['aud'] != app_client_id:
        logger.info('Token was not issued for this audience')
        return False
    # now we can use the claims
    logger.info(claims)
    return claims


class HttpVerb:
    GET     = "GET"
    POST    = "POST"
    PUT     = "PUT"
    PATCH   = "PATCH"
    HEAD    = "HEAD"
    DELETE  = "DELETE"
    OPTIONS = "OPTIONS"
    ALL     = "*"

class AuthPolicy(object):
    awsAccountId = ""
    """The AWS account id the policy will be generated for. This is used to create the method ARNs."""
    principalId = ""
    """The principal used for the policy, this should be a unique identifier for the end user."""
    version = "2012-10-17"
    """The policy version used for the evaluation. This should always be '2012-10-17'"""
    pathRegex = "^[/.a-zA-Z0-9-\*]+$"
    """The regular expression used to validate resource paths for the policy"""

    """these are the internal lists of allowed and denied methods. These are lists
    of objects and each object has 2 properties: A resource ARN and a nullable
    conditions statement.
    the build method processes these lists and generates the approriate
    statements for the final policy"""
    allowMethods = []
    denyMethods = []

    restApiId = "*"
    """The API Gateway API id. By default this is set to '*'"""
    region = "*"
    """The region where the API is deployed. By default this is set to '*'"""
    stage = "*"
    """The name of the stage used in the policy. By default this is set to '*'"""

    def __init__(self, principal, awsAccountId):
        self.awsAccountId = awsAccountId
        self.principalId = principal
        self.allowMethods = []
        self.denyMethods = []

    def _addMethod(self, effect, verb, resource, conditions):
        """Adds a method to the internal lists of allowed or denied methods. Each object in
        the internal list contains a resource ARN and a condition statement. The condition
        statement can be null."""
        if verb != "*" and not hasattr(HttpVerb, verb):
            raise NameError("Invalid HTTP verb " + verb + ". Allowed verbs in HttpVerb class")
        resourcePattern = re.compile(self.pathRegex)
        if not resourcePattern.match(resource):
            raise NameError("Invalid resource path: " + resource + ". Path should match " + self.pathRegex)

        if resource[:1] == "/":
            resource = resource[1:]

        resourceArn = ("arn:aws:execute-api:" +
            self.region + ":" +
            self.awsAccountId + ":" +
            self.restApiId + "/" +
            self.stage + "/" +
            verb + "/" +
            resource)

        if effect.lower() == "allow":
            self.allowMethods.append({
                'resourceArn' : resourceArn,
                'conditions' : conditions
            })
        elif effect.lower() == "deny":
            self.denyMethods.append({
                'resourceArn' : resourceArn,
                'conditions' : conditions
            })

    def _getEmptyStatement(self, effect):
        """Returns an empty statement object prepopulated with the correct action and the
        desired effect."""
        statement = {
            'Action': 'execute-api:Invoke',
            'Effect': effect[:1].upper() + effect[1:].lower(),
            'Resource': []
        }

        return statement

    def _getStatementForEffect(self, effect, methods):
        """This function loops over an array of objects containing a resourceArn and
        conditions statement and generates the array of statements for the policy."""
        statements = []

        if len(methods) > 0:
            statement = self._getEmptyStatement(effect)

            for curMethod in methods:
                if curMethod['conditions'] is None or len(curMethod['conditions']) == 0:
                    statement['Resource'].append(curMethod['resourceArn'])
                else:
                    conditionalStatement = self._getEmptyStatement(effect)
                    conditionalStatement['Resource'].append(curMethod['resourceArn'])
                    conditionalStatement['Condition'] = curMethod['conditions']
                    statements.append(conditionalStatement)

            statements.append(statement)

        return statements

    def allowAllMethods(self):
        """Adds a '*' allow to the policy to authorize access to all methods of an API"""
        self._addMethod("Allow", HttpVerb.ALL, "*", [])

    def denyAllMethods(self):
        """Adds a '*' allow to the policy to deny access to all methods of an API"""
        self._addMethod("Deny", HttpVerb.ALL, "*", [])

    def allowMethod(self, verb, resource):
        """Adds an API Gateway method (Http verb + Resource path) to the list of allowed
        methods for the policy"""
        self._addMethod("Allow", verb, resource, [])

    def denyMethod(self, verb, resource):
        """Adds an API Gateway method (Http verb + Resource path) to the list of denied
        methods for the policy"""
        self._addMethod("Deny", verb, resource, [])

    def allowMethodWithConditions(self, verb, resource, conditions):
        """Adds an API Gateway method (Http verb + Resource path) to the list of allowed
        methods and includes a condition for the policy statement. More on AWS policy
        conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition"""
        self._addMethod("Allow", verb, resource, conditions)

    def denyMethodWithConditions(self, verb, resource, conditions):
        """Adds an API Gateway method (Http verb + Resource path) to the list of denied
        methods and includes a condition for the policy statement. More on AWS policy
        conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition"""
        self._addMethod("Deny", verb, resource, conditions)

    def build(self):
        """Generates the policy document based on the internal lists of allowed and denied
        conditions. This will generate a policy with two main statements for the effect:
        one statement for Allow and one statement for Deny.
        Methods that includes conditions will have their own statement in the policy."""
        if ((self.allowMethods is None or len(self.allowMethods) == 0) and
            (self.denyMethods is None or len(self.denyMethods) == 0)):
            raise NameError("No statements defined for the policy")

        policy = {
            'principalId' : self.principalId,
            'policyDocument' : {
                'Version' : self.version,
                'Statement' : []
            }
        }

        policy['policyDocument']['Statement'].extend(self._getStatementForEffect("Allow", self.allowMethods))
        policy['policyDocument']['Statement'].extend(self._getStatementForEffect("Deny", self.denyMethods))

        return policy