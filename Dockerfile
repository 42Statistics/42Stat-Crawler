FROM node:18
RUN npm install -g pnpm

COPY ./entrypoint.sh /tmp/entrypoint.sh
RUN chmod +x /tmp/entrypoint.sh

WORKDIR /app

ENTRYPOINT /tmp/entrypoint.sh
