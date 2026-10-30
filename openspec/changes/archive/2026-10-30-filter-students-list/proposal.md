# Proposal

## Why

API clients cannot filter student lists on the server. Clients must fetch all students in an organization and filter them in memory. Server-side filtering reduces payload size and supports paginated B2B queries.

## What Changes

- Add an optional `filter` query parameter (`string`) to `GET /students`, `GET /students/byActivity/:activity`, and `GET /api/b2b/participants`.
- Filter students by case-insensitive substring match across `name`, `email`, and elements of `tags`.
- Return all students when `filter` is absent, empty, or contains only whitespace.
- Escape SQL wildcard characters (`%`, `_`, `\`) in `filter` so the database matches them as literal characters.
- Keep existing response shapes on all three endpoints. Update `total` in `GET /api/b2b/participants` to count only matching students.

## Capabilities

### New Capabilities
- `student-filtering`: Server-side filtering of student and participant lists by a search string across `name`, `email`, and `tags`.

### Modified Capabilities

None.

## Impact

- [`src/students/handlers.ts`](src/students/handlers.ts): Accept `filter` in the query schema and apply the filter to `GET /students` and `GET /students/byActivity/:activity`.
- [`src/b2b/handlers.ts`](src/b2b/handlers.ts) and [`src/b2b/domain.ts/participant.ts`](src/b2b/domain.ts/participant.ts): Accept `filter` in `GET /api/b2b/participants` and filter both the participant query and the total count.
- [`src/dal/students.ts`](src/dal/students.ts): Add a query helper that resolves matching student IDs for an organization.

