FROM node:lts-alpine

ENV DATABASE_URL=
ENV PROJECT_ID=
ENV PRIVATE_KEY=
ENV CLIENT_EMAIL=

WORKDIR /usr/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run prisma.generate
RUN npm run build
RUN apk add --no-cache postgresql-client

WORKDIR /usr/app/build
# Temp folder for backup before
# uploading it to the persistent storage
RUN mkdir -p /usr/app/backup
EXPOSE 4000
CMD npm run migrate.up && node ./index.js
