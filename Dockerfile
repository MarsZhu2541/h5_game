FROM nginx
LABEL authors="marszhu"
COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

COPY ./ssl/503666666.cn.pem /etc/nginx/certs/503666666.cn.pem
COPY ./ssl/503666666.cn.key /etc/nginx/certs/503666666.cn.key
COPY ./ssl/lmduo6E1iGXYSiUt3GlY41M6Z3dbVS46DVxQNkk-mas /var/www/example/lmduo6E1iGXYSiUt3GlY41M6Z3dbVS46DVxQNkk-mas

RUN chmod -R 755 /usr/share/nginx/html
