FROM docker.1ms.run/nginx:alpine
LABEL authors="marszhu"

# 证书路径必须与 default.conf 中的 ssl_certificate(_key) 完全一致
COPY ./ssl/139.196.93.191_certificate.pem /ssl/139.196.93.191_certificate.pem
COPY ./ssl/139.196.93.191_private.key     /ssl/139.196.93.191_private.key

COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
COPY yunding/dist /usr/share/nginx/html/yunding

RUN mkdir -p /var/cache/nginx/ai_images \
 && chown -R nginx:nginx /var/cache/nginx/ai_images \
 && chmod 600 /ssl/139.196.93.191_private.key \
 && chmod -R 755 /usr/share/nginx/html \
 && rm -rf /usr/share/nginx/html/ssl /usr/share/nginx/html/default.conf /usr/share/nginx/html/Dockerfile
