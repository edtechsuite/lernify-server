# Tasks

## 1. Data Access Layer

- [x] 1.1 Add `escapeIlike`, `toIlikePattern`, `findStudents(organizationId, filter)`, and `findStudentsByActivity(params)` in [`src/dal/students.ts`](src/dal/students.ts) so each executes in a single `prisma.$queryRaw` call. Verify that `npm run build` succeeds.
- [x] 1.2 Update unit tests in `src/dal/students.test.ts` for `escapeIlike`, `toIlikePattern`, `findStudents`, and `findStudentsByActivity` (name, email, tags, whitespace, and `%`/`_`/`\` escaping). Run `npx jest src/dal/students.test.ts` and verify all tests pass.

## 2. Students Endpoints

- [x] 2.1 Update `GET /students` in [`src/students/handlers.ts`](src/students/handlers.ts) to accept `filter` in `querystring` and call `findStudents(req.organization!.id, req.query.filter)` in a single DB call. Verify that `npm run build` succeeds.
- [x] 2.2 Update `GET /students/byActivity/:activity` in [`src/students/handlers.ts`](src/students/handlers.ts) to accept `filter` in `querystring` and call `findStudentsByActivity(...)` in a single DB call. Verify that `npm run build` succeeds.
- [x] 2.3 Update tests in `src/students/students.test.ts` covering `GET /students` and `GET /students/byActivity/:activity` with and without `filter` in one DB call. Run `npx jest src/students/students.test.ts` and verify all tests pass.

## 3. B2B Participants Endpoint

- [x] 3.1 Update `participantsQsSchema` in [`src/b2b/handlers.ts`](src/b2b/handlers.ts) and `getParticipants` / `findParticipantsWithCount` in [`src/b2b/domain.ts/participant.ts`](src/b2b/domain.ts/participant.ts) to fetch filtered participants and `total` count in a single database call. Verify that `npm run build` succeeds.
- [x] 3.2 Update tests in `src/b2b/participant.test.ts` verifying single-call filtered `list` and `total` count for `getParticipants`. Run `npx jest src/b2b/participant.test.ts` and verify all tests pass.
