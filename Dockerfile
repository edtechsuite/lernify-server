FROM node:18-alpine

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

WORKDIR /usr/app/build
EXPOSE 4000
CMD npm run migrate.up && node ./index.js
