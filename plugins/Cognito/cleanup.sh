#!/bin/bash -e

echo "$(date) cleaning up user pools..."
next_token=""
while true; do
    if [[ "${next_token}" == "" ]]; then
        response=$( aws cognito-idp list-user-pools --max-results 1)
    else
        response=$( aws cognito-idp list-user-pools --max-results 1 --starting-token "$next_token")
    fi

    pool_ids=$(echo "$response" | jq -r '.UserPools[] | select(.Name | test("^.*-ServerlessSaaSUserPool$")) |.Id')
    for i in $pool_ids; do
        if [[ -z "${skip_flag}" ]]; then
            read -p "Delete user pool with name $i [Y/n] " -n 1 -r
        fi

        if [[ $REPLY =~ ^[n]$ ]]; then
            echo "$(date) NOT deleting user pool $i."
        else
            echo "$(date) deleting user pool with name $i..."
            echo "getting pool domain..."
            pool_domain=$(aws cognito-idp describe-user-pool --user-pool-id "$i" | jq -r '.UserPool.Domain')

            echo "deleting pool domain $pool_domain..."
            aws cognito-idp delete-user-pool-domain \
                --user-pool-id "$i" \
                --domain "$pool_domain"

            echo "deleting pool $i..."
            aws cognito-idp delete-user-pool --user-pool-id "$i"
        fi
    done

    next_token=$(echo "$response" | jq '.NextToken')
    if [[ "${next_token}" == "null" ]]; then
        # no more results left. Exit loop...
        break
    fi
done