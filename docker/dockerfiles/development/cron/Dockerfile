FROM registry.nixc.us/cron-base:production
COPY ./config/cron/crontab /tmp/crontab
RUN cat /tmp/crontab > /etc/crontabs/root