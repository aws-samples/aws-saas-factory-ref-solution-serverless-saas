from abstract_classes.idp_authorizer_abstract_class import IdpAuthorizerAbstractClass
import logger
import boto3
import json
import time
import urllib.request
from jose import jwk, jwt
from jose.utils import base64url_decode

region = boto3.session.Session().region_name
class CognitoIdpAuthorizer(IdpAuthorizerAbstractClass):
    def validateJWT(self,event):
        logger.info(event)
        tenant_details = event
        token = tenant_details['jwtToken']
        idp_details = tenant_details['idpDetails']
        tenant_user_pool_id = idp_details['idp']['userPoolId']
        tenant_app_client_id = idp_details['idp']['appClientId']
        keys_url = 'https://cognito-idp.{}.amazonaws.com/{}/.well-known/jwks.json'.format(region, tenant_user_pool_id)
        with urllib.request.urlopen(keys_url) as f:
            response = f.read()
        keys = json.loads(response.decode('utf-8'))['keys']
        return self.__validateJWT(token, tenant_app_client_id, keys)
    
    def getClaims(self,event):
        claims = {}
        claims['username'] = event['cognito:username']
        claims['tenantId'] = event['custom:tenantId']
        claims['userRole'] = event['custom:userRole']
        return claims
    
    def __validateJWT(self, token, app_client_id, keys):
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
