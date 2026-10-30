# Design

## Context

See [`proposal.md`](openspec/changes/filter-students-list/proposal.md) for motivation and [`spec.md`](openspec/changes/filter-students-list/specs/student-filtering/spec.md) for behavior requirements.

All three target endpoints query the PostgreSQL `students` table through the Prisma wrapper in [`src/utils/prisma.ts`](src/utils/prisma.ts). In [`prisma/schema.prisma`](prisma/schema.prisma), `tags` is a PostgreSQL `varchar(256)[]` array. Prisma's generated `StringNullableListFilter` supports only exact element matching (`has`, `hasEvery`, `hasSome`). It does not support case-insensitive substring matching (`ILIKE`) inside array elements.

## Goals / Non-Goals

**Goals:**
- Execute each endpoint's student query in a single database call.
- Provide shared DAL helpers for `ILIKE` pattern escaping and student queries.
- Preserve existing response shapes and pagination logic.
- Escape SQL `ILIKE` wildcard characters safely.

**Non-Goals:**
- Full-text search indexing or `pg_trgm` GIN index migrations.
- Filtering GraphQL queries or Firebase dump endpoints.

## Decisions

### 1. Execute each endpoint in a single parameterized SQL query via `prisma.$queryRaw`

Add `escapeIlike(value: string)` and `toIlikePattern(filter?: string): string | null` in [`src/dal/students.ts`](src/dal/students.ts), where `toIlikePattern` returns `null` when `filter` is absent or whitespace-only and `%${escapeIlike(filter.trim())}%` otherwise.

Each endpoint uses a single `prisma.$queryRaw` call with the filter predicate:
```sql
AND (
  $pattern::text IS NULL
  OR "name" ILIKE $pattern ESCAPE '\'
  OR "email" ILIKE $pattern ESCAPE '\'
  OR EXISTS (
    SELECT 1 FROM unnest("tags") AS t
    WHERE t ILIKE $pattern ESCAPE '\'
  )
)
```

1. **`GET /students`**: `findStudents(organizationId, filter)` in [`src/dal/students.ts`](src/dal/students.ts) selects matching non-deleted students in one query.
2. **`GET /students/byActivity/:activity`**: `findStudentsByActivity(params)` in [`src/dal/students.ts`](src/dal/students.ts) joins `studentsToActivities`, `activities`, and `students` in one query.
3. **`GET /api/b2b/participants`**: `findParticipantsWithCount(page, pageSize, organizationId, filter)` in [`src/b2b/domain.ts/participant.ts`](src/b2b/domain.ts/participant.ts) uses a CTE (`filtered_students`, `counted`, `paged` with `json_agg` for active `studentsToActivities` -> `activity` -> `performer`) to return both the paginated list and `total` count in one database call.

**Rationale:**
- Using `unnest("tags")` matches substrings inside single tags without matching across two adjacent tags.
- Using a single SQL query per endpoint avoids fetching all matching student IDs in a separate round-trip before loading student data.

**Alternatives considered:**
- *Two-step lookup (fetch matching IDs with `$queryRaw`, then pass `id: { in: matchedIds }` to Prisma `findMany`)*: Requires two database calls per request and passes potentially large ID arrays back and forth. Rejected in favor of a single database call.
- *Concatenate tags with `array_to_string(tags, ' ')`*: A search string with a space can match across two adjacent tags. Rejected.
- *Fetch all students and filter in Node.js memory*: `GET /api/b2b/participants` uses database-level pagination and count. Rejected.

## Risks / Trade-offs

- [Sequential scan on `ILIKE '%...%'` and `unnest(tags)`] -> Every query filters by `organization` and `deleted = false`, which bounds the row count per tenant.
- [Timestamps inside `json_agg` serialize as ISO strings] -> Convert `activity.createdAt` back to a `Date` instance when mapping rows in `findParticipantsWithCount`.
