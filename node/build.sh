#!/bin/bash

#docker stop mynode
#docker rm mynode
docker build -t marszhu2541/mynode .
#docker push marszhu2541/mynode
docker save marszhu2541/mynode >mynode.tar
scp mynode.tar Mars@139.196.93.191:/home/Mars/mynode.tar
#docker run --name mynode -p 8000:3000 -d marszhu2541/mynode
