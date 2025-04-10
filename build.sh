#!/bin/bash

#docker stop gamecollection
#docker rm gamecollection
rm gamecollection_cdn.tar
docker build -t marszhu2541/gamecollection:cdn .
docker save marszhu2541/gamecollection:cdn >gamecollection_cdn.tar
scp gamecollection_cdn.tar Mars@139.196.93.191:/home/Mars/gamecollection_cdn.tar
docker push marszhu2541/gamecollection:cdn
#docker run --name gamecollection -p 80:80 -p 443:443 -d marszhu2541/gamecollection:cdn

