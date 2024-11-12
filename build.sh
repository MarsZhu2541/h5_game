#!/bin/bash

#docker stop gamecollection
#docker rm gamecollection
docker build -t marszhu2541/gamecollection .
docker push marszhu2541/gamecollection
#docker run --name gamecollection -p 80:80 -p 443:443 -d marszhu2541/gamecollection

