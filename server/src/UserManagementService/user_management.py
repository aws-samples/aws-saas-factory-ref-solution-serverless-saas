import json
import os
import utils
import auth_manager
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


def get_actor_role():
    """ Returns the role of the caller, as asserted by the Authorizer.

    tenant_authorizer.py puts this into the request context only after it has
    validated the caller's JWT, exactly as it does for tenantId. It therefore
    cannot be influenced by the request body, which is why every authorization
    decision below is made against this value. Reading the role from the payload
    instead would let any caller name their own privileges.

    Read with .get so that a request which somehow arrives without a role is
    denied by the checks below, rather than failing with a KeyError.
    """
    return app.current_event.request_context.authorizer.raw_event.get('userRole')


def authorize_user_management(actor_role):
    """ Rejects callers who may not administer the users of their tenant. """
    if (not auth_manager.isAuthorizedToManageUsers(actor_role)):
        raise PermissionError("Unauthorized: Access denied")


def authorize_tenant_member(actor_role):
    """ Rejects callers whose role is not one of this tenant's two roles.

    Both TenantAdmin and TenantUser pass, so this does not restrict any caller
    who can legitimately reach this function. It is here so the read routes
    still fail closed if a token ever carries an unexpected role.
    """
    if (not auth_manager.isRecognizedTenantRole(actor_role)):
        raise PermissionError("Unauthorized: Access denied")


def authorize_role_assignment(user_role):
    """ Rejects an attempt to assign a role outside this tenant's two roles.

    This is the escalation ceiling. It applies to every caller, including a
    legitimate TenantAdmin, so a SaaS provider role can never be granted to
    anybody through this API.
    """
    if (not auth_manager.isRecognizedTenantRole(user_role)):
        raise PermissionError(
            "Unauthorized: role '{0}' cannot be assigned to a tenant user".format(user_role))


def create_forbidden_response():
    """ 403, not 401: the caller authenticated successfully, they are simply not
    permitted to perform this action. The Authorizer is what returns 401. """
    return Response(status_code=HTTPStatus.FORBIDDEN.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "User not authorized to perform this action"}))


@app.post("/users")
@tracer.capture_method
def create_user():
    actor_role = get_actor_role()
    user_details = app.current_event.json_body
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    user_details['actorRole'] = actor_role
    user_details['idpDetails'] = idp_details

    try:
        logger.info("Request received to create new user")
        authorize_user_management(actor_role)
        authorize_role_assignment(user_details.get('userRole'))
        response = idp_user_mgmt_service.create_user(user_details)
        logger.info("Request completed to create new user ")

        return Response(status_code=HTTPStatus.OK.value,
                        content_type=content_types.APPLICATION_JSON,
                        body=json.dumps({"response": "New user created"}))

    except PermissionError as e:
        logger.error(e)
        return create_forbidden_response()

@app.get("/users")
@tracer.capture_method
def get_users():
    actor_role = get_actor_role()
    user_details = {}
    user_details['idpDetails'] = idp_details
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']

    try:
        logger.info("Request received to get user")
        authorize_tenant_member(actor_role)
        response = idp_user_mgmt_service.get_users(user_details)

        logger.info(response)
        return  Response(status_code=HTTPStatus.OK.value,
                        content_type=content_types.APPLICATION_JSON,
                        body=utils.encode_to_json_object(response))

    except PermissionError as e:
        logger.error(e)
        return create_forbidden_response()


@app.get("/users/<username>")
@tracer.capture_method
def get_user(username):
    actor_role = get_actor_role()
    user_details = {}
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    try:
        logger.info("Request received to get user")
        authorize_tenant_member(actor_role)
        user_info = idp_user_mgmt_service.get_user(user_details)
        logger.info("Request completed to get new user ")

        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": user_info.__dict__}))

    except PermissionError as e:
        logger.error(e)
        return create_forbidden_response()


@app.put("/users/<username>")
@tracer.capture_method
def update_user(username):
    actor_role = get_actor_role()
    user_details = app.current_event.json_body
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    user_details['actorRole'] = actor_role
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username

    try:
        logger.info("Request received to get user")
        # This route writes custom:userRole, so it is administration of a tenant
        # member and never self service. Both checks are required: the first
        # stops an ordinary user editing anybody, including themselves, and the
        # second stops a TenantAdmin minting a SaaS provider role.
        authorize_user_management(actor_role)
        authorize_role_assignment(user_details.get('userRole'))
        response = idp_user_mgmt_service.update_user(user_details)
        logger.info(response)
        logger.info("Request completed to update user ")
        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "user updated"}))

    except PermissionError as e:
        logger.error(e)
        return create_forbidden_response()



@app.delete("/users/<username>/disable")
@tracer.capture_method
def disable_user(username):
    actor_role = get_actor_role()
    user_details = {}
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    user_details['actorRole'] = actor_role

    try:
        logger.info("Request received to disable new user")
        authorize_user_management(actor_role)
        response = idp_user_mgmt_service.disable_user(user_details)
        logger.info(response)
        logger.info("Request completed to disable new user ")
        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "user disabled"}))


    except PermissionError as e:
        logger.error(e)
        return create_forbidden_response()



@app.put("/users/<username>/enable")
@tracer.capture_method
def enable_user(username):
    actor_role = get_actor_role()
    user_details = {}
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    user_details['actorRole'] = actor_role

    try:
        logger.info("Request received to enable new user")
        authorize_user_management(actor_role)
        response = idp_user_mgmt_service.enable_user(user_details)
        logger.info(response)
        logger.info("Request completed to enable new user ")
        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "user enabled"}))

    except PermissionError as e:
        logger.error(e)
        return create_forbidden_response()



@app.delete("/users/<username>")
@tracer.capture_method
def delete_user(username):
    actor_role = get_actor_role()
    user_details = {}
    user_details['idpDetails'] = idp_details
    user_details['userName'] = username
    user_details['tenantId'] = app.current_event.request_context.authorizer.raw_event['tenantId']
    user_details['actorRole'] = actor_role

    try:
        logger.info("Request received to delete new user")
        authorize_user_management(actor_role)
        response = idp_user_mgmt_service.delete_user(user_details)
        logger.info(response)
        logger.info("Request completed to delete new user ")
        return Response(status_code=HTTPStatus.OK.value,
                    content_type=content_types.APPLICATION_JSON,
                    body=json.dumps({"response": "user deleted"}))

    except PermissionError as e:
        logger.error(e)
        return create_forbidden_response()



@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
@tracer.capture_lambda_handler
def lambda_handler(event, context):
    logger.debug(event)
    return app.resolve(event, context)


