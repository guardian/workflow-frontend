DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
nginxHome=`nginx -V 2>&1 | grep "configure arguments:" | sed 's/[^*]*conf-path=\([^ ]*\)\/nginx\.conf.*/\1/g'`

sudo ln -fs $DIR/workflow.conf $nginxHome/sites-enabled/workflow.conf
sudo ln -fs $DIR/workflow.crt $nginxHome/workflow.crt
sudo ln -fs $DIR/workflow.key $nginxHome/workflow.key
sudo nginx -s stop
sudo nginx