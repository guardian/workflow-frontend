#!/usr/bin/env bash
set -e

function HELP {
>&2 cat << EOF

  Usage: ${0} -t RDS-HOST [-s CODE] [-u ubuntu]

  This script sets up an ssh tunnel from localhost port 5902 to the RDS-HOST provided on port 5432
   using a workflow datastore instance discovered via prism as a bastion host.

    -u user       [optional] the user to install the SSH keys for. Defaults to ubuntu.

    -s stage      [optional] the stage to set up an ssh tunnel for. Defaults to CODE.

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
    u)
      SSH_USER=$OPTARG
      ;;
    s)
      STAGE=$OPTARG
      ;;
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

if [ -z "${SSH_USER}" ]; then
  SSH_USER="ubuntu"
fi

DATASTORE_ELB=$(aws elb describe-load-balancers --load-balancer-names workflow-Datastor-11M4N9N3HTIJB --profile workflow --region eu-west-1 | jq .LoadBalancerDescriptions[].DNSName -r)

if [[ -z "$DATASTORE_ELB" ]];
then
    echo "Couldn't find Datastore ELB (no auth creds?)"
    exit 1
fi

WF_FRONTEND_HOST=$(marauder -s stage=${STAGE} app=workflow-frontend --short)
echo $WF_FRONTEND_HOST

echo "Runnning command: ssh -f ${SSH_USER}@${WF_FRONTEND_HOST} -L 5002:${DATASTORE_ELB}:80 -N"

ssh ${BACKGROUND} ${SSH_USER}@${WF_FRONTEND_HOST} -L 5002:${DATASTORE_ELB}:80 -N
