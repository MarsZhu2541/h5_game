#!/bin/bash
set -euo pipefail

# 云顶前端：先本地构建，镜像内只 COPY dist（Dockerfile 不再含 node 构建阶段）
#(
#  cd "$(dirname "$0")/yunding"
#  npm ci
#  npm run build
#)

# 同名容器若已存在，docker run 会直接失败，浏览器仍指向旧容器；先删再跑
docker rm -f gamecollection 2>/dev/null || true
rm -f gamecollection_s18.tar
docker build --platform linux/amd64 -t marszhu2541/gamecollection:s18 .
docker save marszhu2541/gamecollection:s18 >gamecollection_s18.tar
scp gamecollection_s18.tar Mars@139.196.93.191:/home/Mars/gamecollection_s18.tar
# docker push marszhu2541/gamecollection:cdn
# 标签名与 Hub 一致仅为了方便 push；本地刚 build 的镜像优先，不主动 pull
#docker run --name gamecollection -p 80:80 -d marszhu2541/gamecollection:s18
