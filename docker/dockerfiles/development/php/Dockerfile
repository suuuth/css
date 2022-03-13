FROM registry.nixc.us/c5php-base:production
#Mail Hog Dev Only
RUN curl -Lsf 'https://golang.org/dl/go1.8.3.linux-amd64.tar.gz' | tar -C '/usr/local' -xvzf -
ENV PATH /usr/local/go/bin:$PATH
RUN go get github.com/mailhog/mhsendmail && cp /root/go/bin/mhsendmail /usr/bin/mhsendmail

COPY ./config/php/php.dev.ini /usr/local/etc/php/php.ini

#Copy C5 Config Files

RUN mkdir /var/www/config && \
    chmod 777 /var/www/config

#Copy Config files and change permissions
COPY ./config/c5/config /var/www/config/
RUN chown -R 1000:1000 /var/www/config && \
    chmod -R 777 /var/www/config
