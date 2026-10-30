# student-filtering Specification

## Purpose

Filters student and participant lists on the server by a search string across student names, email addresses, and tags.

## Requirements

### Requirement: Filter student list by search string
The system SHALL accept an optional `filter` query parameter on `GET /students`, `GET /students/byActivity/:activity`, and `GET /api/b2b/participants`. The system SHALL trim leading and trailing whitespace from `filter`. The system SHALL return only students whose `name`, `email`, or any tag in `tags` contains the trimmed string (case-insensitive).

#### Scenario: Filter matches student name
- **WHEN** a client requests `GET /students?filter=ali` and the organization has a student with `name` `"Alice Smith"`
- **THEN** the response includes `"Alice Smith"` and excludes students that do not match `"ali"` in `name`, `email`, or `tags`

#### Scenario: Filter matches student email
- **WHEN** a client requests `GET /students?filter=EXAMPLE.COM` and the organization has a student with `email` `"bob@example.com"`
- **THEN** the response includes the student with `email` `"bob@example.com"`

#### Scenario: Filter matches student tag substring
- **WHEN** a client requests `GET /students?filter=beg` and the organization has a student with `tags` `["Beginner-2026"]`
- **THEN** the response includes the student with `tags` `["Beginner-2026"]`

#### Scenario: Filter does not match across separate tags
- **WHEN** a client requests `GET /students?filter=math advanced` and a student has `tags` `["math", "advanced"]` with no match in `name` or `email`
- **THEN** the response excludes that student

#### Scenario: Filter on activity students endpoint
- **WHEN** a client requests `GET /students/byActivity/42?filter=ali`
- **THEN** the response returns only students assigned to activity `42` that match `"ali"` in `name`, `email`, or `tags`

### Requirement: Ignore absent or whitespace-only filter
When `filter` is absent, empty, or contains only whitespace characters, the system SHALL apply no search filter and return all eligible students for the endpoint.

#### Scenario: Empty or whitespace filter returns full list
- **WHEN** a client requests `GET /students?filter=%20%20`
- **THEN** the system returns all non-deleted students in the organization

### Requirement: Escape SQL wildcard characters in filter
The system SHALL treat `%`, `_`, and `\` in `filter` as literal characters and not as wildcard patterns.

#### Scenario: Percent and underscore characters match literally
- **WHEN** a client requests `GET /students?filter=100%`
- **THEN** the system matches only students whose `name`, `email`, or `tags` contain the literal substring `"100%"`

### Requirement: Preserve B2B participant response shape and update total count
On `GET /api/b2b/participants`, the system SHALL keep the existing response schema and set `total` to the count of students in the organization that match `filter`.

#### Scenario: Paginated B2B participants with filter
- **WHEN** a client requests `GET /api/b2b/participants?page=0&pageSize=10&filter=vip` and 3 students in the organization have the tag `"vip-member"`
- **THEN** the response returns those 3 students in `list` with their existing fields (`id`, `name`, `tags`, `activities`) and sets `total` to `3`

