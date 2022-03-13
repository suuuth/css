FROM registry.nixc.us/sshd-base:production
USER root
COPY ./config/sshd/authorized_keys /tmp/authorized_keys
RUN for FILE in /tmp/authorized_keys/* ; do echo "$(cat $FILE)\n" >> ~/.ssh/authorized_keys ; done && \
    chmod 644 ~/.ssh/authorized_keys
