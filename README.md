# lernify-server

## Getting started

- Create Google Firebase project (https://console.firebase.google.com)
- Generate and download `serviceAccountKey` from `https://console.firebase.google.com/u/0/project/{PROJECT_ID}/settings/serviceaccounts/adminsdk`
- Save it as a `service-account-key-secret.json` file in the project root
- Add `GOOGLE_APPLICATION_CREDENTIALS=".\service-account-key-secret.json"` to the `.env` file
- Run `npm install` to install project dependency from the CLI
- Run migrations `npm run migrate up`
- Run `npm run prisma.generate` to generate Prisma typings
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

`PROJECT_ID`: Firebase project id
`CLIENT_EMAIL`: Firebase client email
`PRIVATE_KEY`: Firebase private key
`DISABLE_DATABASE_SECURE_CONNECTION`: if `true` secure connection for the database will be disabled (used for the connect to the local Postgres instance)

You can find `PROJECT_ID`, `CLIENT_EMAIL`, `PRIVATE_KEY` in the Firebase `service account` credentials json file

`PORT`: The port that service will listen to

## Significant dependency

`fastify`: Http server
`firebase-admin`: SDK to access Firebase service
`winston`: Logging tool
`typescript`: We are using Typescript

## Migrations

To create migration script run `npm run migrate.create my migration script` where `my migration script` is short description of the migration. It will create file xxx_my-migration-script.js in migrations folder.

To migrate database run `npm run migrate.up`, `npm run prisma.pull` and `npm run prisma.generate`

## Tmp

TODO: check user to perform data migration

organization

    id: TestOrg
    mama: TestOrg

user2org
user: u1
org:
role

user
id: u1
role: null
role (organizational): manager, administrator, teacher (default)
user
id: u2
name: some
role: system-administrator

===================

organization
id: string
key: string
name: string
owner: user(id)

user
systemRole (global): system-administrator

https://casbin.org/docs/en/supported-models

final firebase structure:

    db:
        organizations
            orgKey
                attendance
    							users

    rules:
        forbid all (no public access)

invite flow: - send invite request with email - send email with `accept` btn - go to accept page - sign up (optional) - send accept request with token - record db
