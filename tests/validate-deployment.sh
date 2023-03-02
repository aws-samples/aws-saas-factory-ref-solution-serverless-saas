#!/bin/bash -e

OUTPUT=$(../deployment.sh | tail -n 1)

echo $OUTPUT

if [[ $OUTPUT != "Successfully completed deployment" ]]; then
    echo "deployment.sh script Failed !!"
    exit 1
else
   echo "deployment.sh script completed successfully"
fi