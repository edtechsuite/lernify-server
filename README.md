# lernify-server

## Getting started

- Create Google Firebase project (https://console.firebase.google.com)
- Generate and download `serviceAccountKey` from `https://console.firebase.google.com/u/0/project/{PROJECT_ID}/settings/serviceaccounts/adminsdk`
- Save it as a `service-account-key-secret.json` file in the project root
- Add `GOOGLE_APPLICATION_CREDENTIALS=".\service-account-key-secret.json"` to the `.env` file
- Run `npm install` to install project dependency from the CLI
- Run `npm run start` to start project from the CLI

## Before commit

- Add updates to commit message
- Update Readme in case of:
  - Updated ENV variables
  - Added/removed npm modules
  - Added/removed services

## TODO

- Addd `eslint`
- Addd `tests`
- User profile
- Organizations

## Plan

- Login (optional)
- Get me
- Get my organizations
- Create organization
- Invite user to organization
- Edit roles
- Add data
  - Groups
  - Students
  - Attendance

## Env variables

`GOOGLE_APPLICATION_CREDENTIALS`: Path to the `service account` credentials json file relative to the project root (eg `".\service-account-key-secret.json"`)
`PORT`: The port that service will listen to

## Significant dependency

`fastify`: Http server
`firebase-admin`: SDK to access Firebase service
`winston`: Logging tool
`typescript`: We are using Typescript
