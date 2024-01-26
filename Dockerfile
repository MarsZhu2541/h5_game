FROM nginx
LABEL authors="marszhu"
COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html
