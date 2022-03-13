FROM registry.nixc.us/c5php-base:production
## Add website contents and make config folder
ADD ./public_html /var/www/html
RUN chown -R 1000:1000 /var/www/html && \
    mkdir /var/www/config && \
    chmod 777 /var/www/config

#Copy Production Values
ADD ./config/php/php.prod.ini /usr/local/etc/php/php.ini

#Copy Config files and change permissions
ADD ./config/c5/config /var/www/config/
RUN chown -R 1000:1000 /var/www/config && \
    chmod -R 777 /var/www/config

