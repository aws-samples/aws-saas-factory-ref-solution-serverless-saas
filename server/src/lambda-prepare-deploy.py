# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
import boto3
import json
import zipfile
import traceback

print('Loading function')
s3 = boto3.client('s3')
code_pipeline = boto3.client('codepipeline')
dynamodb = boto3.resource('dynamodb')
table_tenant_stack_mapping = dynamodb.Table(os.environ['TENANT_MAPPING_TABLE'])

def find_artifact(artifacts, name):
    """Finds the artifact 'name' among the 'artifacts'

    Args:
        artifacts: The list of artifacts available to the function
        name: The artifact we wish to use
    Returns:
        The artifact dictionary found
    Raises:
        Exception: If no matching artifact is found

    """
    for artifact in artifacts:
        if artifact['name'] == name:
            return artifact

    raise Exception('Input artifact named "{0}" not found in event'.format(name))


def put_job_success(job, message):
    """Notify CodePipeline of a successful job

    Args:
        job: The CodePipeline job ID
        message: A message to be logged relating to the job status

    Raises:
        Exception: Any exception thrown by .put_job_success_result()

    """
    print('Putting job success')
    print(message)
    code_pipeline.put_job_success_result(jobId=job)


def put_job_failure(job, message):
    """Notify CodePipeline of a failed job

    Args:
        job: The CodePipeline job ID
        message: A message to be logged relating to the job status

    Raises:
        Exception: Any exception thrown by .put_job_failure_result()

    """
    print('Putting job failure')
    print(message)
    code_pipeline.put_job_failure_result(jobId=job, failureDetails={'message': message, 'type': 'JobFailed'})


def get_user_params(job_data):
    """Decodes the JSON user parameters and validates the required properties.

    Args:
        job_data: The job data structure containing the UserParameters string which should be a valid JSON structure

    Returns:
        The JSON parameters decoded as a dictionary.

    Raises:
        Exception: The JSON can't be decoded or a property is missing.

    """
    try:
        # Get the user parameters which contain the stack, artifact and file settings
        user_parameters = job_data['actionConfiguration']['configuration']['UserParameters']
        decoded_parameters = json.loads(user_parameters)

    except Exception:
        # We're expecting the user parameters to be encoded as JSON
        # so we can pass multiple values. If the JSON can't be decoded
        # then fail the job with a helpful message.
        raise Exception('UserParameters could not be decoded as JSON')

    if 'artifact' not in decoded_parameters:
        # Validate that the artifact name is provided, otherwise fail the job
        # with a helpful message.
        raise Exception('Your UserParameters JSON must include the artifact name')

    if 's3_source_version_id' not in decoded_parameters:
        # Validate that the s3 source version ID is provided, otherwise fail the job
        # with a helpful message.
        raise Exception('Your UserParameters JSON must include the template file name')

    return decoded_parameters


def add_parameter(params, parameter_key, parameter_value):
    parameter = {}
    parameter['ParameterKey'] = parameter_key
    parameter['ParameterValue'] = parameter_value
    params.append(parameter)


def lambda_handler(event, context):
    """The Lambda function handler
    Args:
        event: The event passed by Lambda
        context: The context passed by Lambda

    """
    try:
        # Extract the Job ID
        job_id = event['CodePipeline.job']['id']
        print("job_id: ", job_id)

        # Extract the Job Data
        job_data = event['CodePipeline.job']['data']
        print("job_data: ", job_data)

        # Extract the params
        params = get_user_params(job_data)
        commit_id = params['s3_source_version_id']

        # Get the list of artifacts passed to the function
        output_artifact = job_data['outputArtifacts'][0]

        # Get all the stacks for each tenant to be updated/created from tenant stack mapping table
        mappings = table_tenant_stack_mapping.scan()
        print('mappings success: ', mappings)
        output_bucket = output_artifact['location']['s3Location']['bucketName']
        output_key = output_artifact['location']['s3Location']['objectKey']
        stacks = []

        # Create array to pass to step function
        for mapping in mappings['Items']:
            stack = mapping['stackName']
            tenantId = mapping['tenantId']
            waveNumber = mapping['waveNumber']
            stacks.append(
                {
                    "stackName": stack,
                    "tenantId": tenantId,
                    "commitId": commit_id,
                    "waveNumber": int(waveNumber)
                })

    except Exception as e:
        # If any other exceptions which we didn't expect are raised
        # then fail the job and log the exception message.
        print('Function failed due to exception.')
        print(e)
        traceback.print_exc()
        put_job_failure(job_id, 'Function exception: ' + str(e))

    print(stacks)

    # write stacks variable to file
    with open('/tmp/output.json', 'w') as outfile:
        json.dump({"stacks": stacks}, outfile)

    # zip the file
    with zipfile.ZipFile('/tmp/output.json.zip', 'w') as zip:
        zip.write('/tmp/output.json', 'output.json')

    # upload the output to output_bucket in s3
    s3.upload_file('/tmp/output.json.zip', output_bucket, output_key)
    print('output.json.zip uploaded to s3')

    put_job_success(job_id, "Function complete.")
    print('Function complete.')
    return stacks
