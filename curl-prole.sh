while ! lsof -i :9001 > /dev/null;
	do sleep 5;
done;	
curl http://localhost:9001/management/healthcheck
