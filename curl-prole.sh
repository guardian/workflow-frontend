while ! lsof -i :9091 > /dev/null;
	do sleep 5;
done;	
curl http://localhost:9091/management/healthcheck
