import json
import boto3
import logger
from boto3.dynamodb.conditions import Key
from crhelper import CfnResource
helper = CfnResource()

try:
    client = boto3.client('dynamodb')
    dynamodb = boto3.resource('dynamodb')
except Exception as e:
    helper.init_failure(e)
    
@helper.create
@helper.update
def do_action(event, _):
    """ The URL for Tenant APIs(Product/Order) can differ by tenant.
        For Pooled tenants it is shared and for Silo (Platinum tier tenants) it is unique to them.
        This method keeps the URL for Pooled tenants inside Settings Table, since it is shared across multiple tenants,
        And for Silo tenants inside the tenant management table along with other tenant settings, for that tenant

    Args:
        event ([type]): [description]
        _ ([type]): [description]
    """
    logger.info("Updating Tenant Details table")

    tenant_details_table_name = event['ResourceProperties']['TenantDetailsTableName']
    settings_table_name = event['ResourceProperties']['SettingsTableName']
    tenant_id = event['ResourceProperties']['TenantId']
    tenant_api_gateway_url = event['ResourceProperties']['TenantApiGatewayUrl']


    if(tenant_id.lower() =='pooled'):
        # Note: Tenant management service will use below setting to update apiGatewayUrl for pooled tenants in TenantDetails table
        settings_table = dynamodb.Table(settings_table_name)
        settings_table.put_item(Item={
                    'settingName': 'apiGatewayUrl-Pooled',
                    'settingValue' : tenant_api_gateway_url                    
                })
        
    else:
        tenant_details = dynamodb.Table(tenant_details_table_name)
        response = tenant_details.update_item(
            Key={'tenantId': tenant_id},
            UpdateExpression="set apiGatewayUrl=:apiGatewayUrl",
            ExpressionAttributeValues={
            ':apiGatewayUrl': tenant_api_gateway_url
            },
            ReturnValues="NONE") 
                   
    
@helper.delete
def do_nothing(_, __):
    pass

def handler(event, context):   
    logger.info(event)
    helper(event, context)
        
    