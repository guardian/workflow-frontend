FROM amazon/dynamodb-local:latest

USER root

RUN yum install -y awscli && \
    yum clean all

COPY images/start-dynamodb /usr/local/bin/start-dynamodb
COPY fixtures/dynamodb/editorial-support-CODE.json /opt/dynamodb-fixtures/editorial-support-CODE.json

RUN chmod +x /usr/local/bin/start-dynamodb

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/start-dynamodb"]
