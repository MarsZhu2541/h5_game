# 云顶：请在宿主机执行 cd yunding && npm ci && npm run build，再 docker build（见 build.sh）
FROM docker.1ms.run/nginx:alpine
LABEL authors="marszhu"

COPY ./default.conf /etc/nginx/conf.d/default.conf

# 整站静态资源（游戏合集等）
COPY . /usr/share/nginx/html

# 云顶 Vite 产物（本地构建生成 yunding/dist）
COPY yunding/dist /usr/share/nginx/html/yunding

COPY ./ssl/503666666.cn.pem /etc/nginx/certs/503666666.cn.pem
COPY ./ssl/503666666.cn.key /etc/nginx/certs/503666666.cn.key
COPY ./ssl/lmduo6E1iGXYSiUt3GlY41M6Z3dbVS46DVxQNkk-mas /var/www/example/lmduo6E1iGXYSiUt3GlY41M6Z3dbVS46DVxQNkk-mas

RUN chmod -R 755 /usr/share/nginx/html
