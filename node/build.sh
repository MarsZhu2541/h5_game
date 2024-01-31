#!/bin/bash

docker stop mynode
docker rm mynode
docker build -t marszhu2541/mynode .
#docker push marszhu2541/mynode
docker run --name mynode -p 3000:3000 -d marszhu2541/mynode
