#!/usr/bin/env bash
set -e

function HELP {
>&2 cat << EOF

  Usage: ${0} -t RDS-HOST [-s CODE] [-u ubuntu]

  This script sets up an ssh tunnel from localhost port 5902 to the CODE RDS-HOST provided on port 5432
   using a workflow datastore instance discovered via SSM as a bastion host.

    -d            Don't run in the background

    -v            Verbose ssh output

    -h            Displays this help message. No further functions are
                  performed.

EOF
exit 1
}

BACKGROUND="-f"
VERBOSE=""

# Process options
while getopts u:s:t:dhv FLAG; do
  case $FLAG in
    d)
      BACKGROUND=""
      ;;
    h)  #show help
      HELP
      ;;
    v)
      VERBOSE="-v"
      ;;
  esac
done
shift $((OPTIND-1))


if [ -z "${STAGE}" ]; then
  STAGE="CODE"
fi

echo "📡 getting ELB name from AWS"

DATASTORE_ELB=$(aws elb describe-load-balancers --load-balancer-names workflow-Datastor-11M4N9N3HTIJB --profile workflow --region eu-west-1 | jq .LoadBalancerDescriptions[].DNSName -r)

if [[ -z "$DATASTORE_ELB" ]];
then
    echo "❌ Couldn't find Datastore ELB (no auth creds?)"
    exit 1
fi
echo "🛰 ELB identified $DATASTORE_ELB"

echo "🛰 fetching connection details from ssm"

SSM_COMMAND=$(ssm ssh --profile workflow -t workflow-frontend,workflow,$STAGE --newest --ssm-tunnel --raw)

echo "📠 ESTABLISHING CONNECTION"

echo "$SSM_COMMAND"
eval $SSM_COMMAND $VERBOSE -L 5002:${DATASTORE_ELB}:80 -N ${BACKGROUND}
