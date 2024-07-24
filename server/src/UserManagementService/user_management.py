import json
import os
import utils
from http import HTTPStatus
from aws_lambda_powertools.event_handler import (Response, 
                                                 content_types)
from aws_lambda_powertools import Tracer
from aws_lambda_powertools import Logger
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
import idp_object_factory

tracer = Tracer()
logger = Logger()
cors_config = CORSConfig(allow_origin="*", max_age=300)
app = APIGatewayRestResolver(cors=cors_config)


idp_details=json.loads(os.environ['IDP_DETAILS'])

idp_user_mgmt_service = idp_object_factory.get_idp_user_mgmt_object(idp_details['name'])

@app.post("/users")
@tracer.capture_method
def create_user():
    logger.info("Request received to create new user")
    user_details = app.current_event.json_body
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    user_details['idpDetails'] = idp_details
    response = idp_user_mgmt_service.create_user(user_details)
    logger.info("Request completed to create new user ")

    return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "New user created"}))

@app.get("/users")
@tracer.capture_method
def get_users():
    user_details = {}
    user_details['idpDetails'] = idp_details  
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    logger.info("Request received to get user")
    response = idp_user_mgmt_service.get_users(user_details)
        
    logger.info(response) 
    num_of_users = len(response)
    return  Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=utils.encode_to_json_object(response))


@app.get("/users/<username>")
@tracer.capture_method
def get_user(username):
    user_details = {}
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    try:
        logger.info("Request received to get user")
        user_info = idp_user_mgmt_service.get_user(user_details)
        logger.info("Request completed to get new user ")
        
        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": user_info.__dict__}))

    except PermissionError as e:
        logger.error(e)
        return Response(status_code=HTTPStatus.UNAUTHORIZED.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "User not authorized to perform this action"}))
    
    
@app.put("/users/<username>")
@tracer.capture_method
def update_user(username):
    user_details = app.current_event.json_body
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username

    try:
        logger.info("Request received to get user")
        response = idp_user_mgmt_service.update_user(user_details)
        logger.info(response)
        logger.info("Request completed to update user ")
        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "user updated"}))
        
    except PermissionError as e:
        logger.error(e)
        return Response(status_code=HTTPStatus.UNAUTHORIZED.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "User not authorized to perform this action"}))
    
      

@app.delete("/users/<username>/disable")
@tracer.capture_method
def disable_user(username):
    user_details = {}
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']

    try:
        logger.info("Request received to disable new user")
        response = idp_user_mgmt_service.disable_user(user_details)
        logger.info(response)
        logger.info("Request completed to disable new user ")
        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "user disabled"}))
        

    except PermissionError as e:
        logger.error(e)
        return Response(status_code=HTTPStatus.UNAUTHORIZED.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "User not authorized to perform this action"}))

    

@app.put("/users/<username>/enable")
@tracer.capture_method
def enable_user(username):
    user_details = {}
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']

    try:
        logger.info("Request received to enable new user")
        response = idp_user_mgmt_service.enable_user(user_details)
        logger.info(response)
        logger.info("Request completed to enable new user ")
        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "user enabled"}))

    except PermissionError as e:
        logger.error(e)
        return Response(status_code=HTTPStatus.UNAUTHORIZED.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "User not authorized to perform this action"}))

    

@app.delete("/users/<username>")
@tracer.capture_method
def delete_user(username):
    user_details = {}
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']

    try:
        logger.info("Request received to delete new user")
        response = idp_user_mgmt_service.delete_user(user_details)
        logger.info(response)
        logger.info("Request completed to delete new user ")
        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "user deleted"}))

    except PermissionError as e:
        logger.error(e)
        return Response(status_code=HTTPStatus.UNAUTHORIZED.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "User not authorized to perform this action"}))

    

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
@tracer.capture_lambda_handler
def lambda_handler(event, context):
    logger.debug(event)
    return app.resolve(event, context)


