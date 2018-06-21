#!/usr/bin/env bash
set -e

function HELP {
>&2 cat << EOF

  Usage: ${0} -t RDS-HOST [-s CODE] [-u ubuntu]

  This script sets up an ssh tunnel from localhost port 5902 to the CODE RDS-HOST provided on port 5432
   using a workflow datastore instance discovered via SSM as a bastion host.

    -d            Don't run in the background

    -h            Displays this help message. No further functions are
                  performed.

EOF
exit 1
}

BACKGROUND="-f"

# Process options
while getopts u:s:t:dh FLAG; do
  case $FLAG in
    d)
      BACKGROUND=""
      ;;
    h)  #show help
      HELP
      ;;
  esac
done
shift $((OPTIND-1))


if [ -z "${STAGE}" ]; then
  STAGE="CODE"
fi

DATASTORE_ELB=$(aws elb describe-load-balancers --load-balancer-names workflow-Datastor-11M4N9N3HTIJB --profile workflow --region eu-west-1 | jq .LoadBalancerDescriptions[].DNSName -r)

if [[ -z "$DATASTORE_ELB" ]];
then
    echo "Couldn't find Datastore ELB (no auth creds?)"
    exit 1
fi

eval $(ssm ssh --profile workflow -t workflow-frontend,workflow,$STAGE --newest --raw) \
    -L 5002:${DATASTORE_ELB}:80 -N ${BACKGROUND}
