import { Prisma } from '@prisma/client'
import { prisma } from '../../utils/prisma'
import { Filter, GroupsFilter, PaginationConfig } from './types'

export async function getReportRecords(
	orgId: number,
	filters: Filter[],
	range: Range,
	config?: PaginationConfig
) {
	const filterSql = makeFilterSql(filters, range, orgId)
	const totalResult = await makeTotalQuery(filterSql, filters)
	return {
		data: await makeQuery(
			filterSql,
			config?.pageSize,
			config && config.page * config.pageSize,
			filters
		),
		total: totalResult[0].count,
	}
}

async function makeQuery(
	filtersQuery: Prisma.Sql,
	limit?: number,
	offset?: number,
	filters?: Filter[]
) {
	return await prisma.$queryRaw<QueryResult[]>`
		SELECT DISTINCT ON (s."id", act."id")
		s."id", s."name", s."tags", s."outerId",
		act."id" as "activityId",
		act."name" as "activityName",
		act."deleted" as "activityDeleted",
		act."archived" as "activityArchived",
		act."outerId" as "activityOuterId",
		sta."startDate",
		sta."endDate",
		u.id as "performerId",
		u2o.name as "performerName"
		${getConditionQuery(filtersQuery, filters ?? [])}
		${getPaginationQuery(limit, offset)}
	`
}
function getConditionQuery(filtersQuery: Prisma.Sql, filters: Filter[]) {
	return Prisma.sql`
		FROM students AS s
		${getJoinS2AQuery(filters)}
		LEFT JOIN "activities" as act ON sta."activityId" = act.id
		LEFT JOIN "users" as u ON act."performerId" = u.id
		LEFT JOIN "usersToOrganizations" as u2o ON act."performerId" = u2o."userId"
		WHERE ${filtersQuery}
	`
}
function getJoinS2AQuery(filters: Filter[]) {
	const activitiesFilter = filters
		.filter(isActivityFilter)
		.flatMap((f) => f.value)
	if (activitiesFilter.length === 0) {
		return Prisma.sql`LEFT JOIN "studentsToActivities" as sta ON sta."participantId" = s.id`
	}
	return Prisma.sql`
		LEFT JOIN "studentsToActivities" as sta ON sta."participantId" = s.id AND sta."activityId" in (${Prisma.join(
			activitiesFilter,
			','
		)})
	`
}
function isActivityFilter(filter: Filter): filter is GroupsFilter {
	return filter.field === 'group'
}
function getPaginationQuery(limit?: number, offset?: number) {
	return typeof limit === 'number' && typeof offset === 'number'
		? Prisma.sql`
			LIMIT ${limit}
			OFFSET ${offset}
		`
		: Prisma.empty
}

async function makeTotalQuery(filtersQuery: Prisma.Sql, filters: Filter[]) {
	return await prisma.$queryRaw<[{ count: number }]>`
		-- COUNT(*) returns BigInt, but we need int to prevent failing the request
		SELECT COUNT(*)::int FROM (
			SELECT DISTINCT ON (s."id", act."id")
			s."id"
			${getConditionQuery(filtersQuery, filters)}
		) as tmp
	`
}

function makeFilterSql(filters: Filter[], range: Range, orgId: number) {
	return Prisma.join(
		filters
			.map((f) => getRequestPart(f))
			.concat([
				Prisma.sql`organization = ${orgId}`,
				Prisma.sql`s.deleted = false`,
				Prisma.sql`sta."startDate" < ${range.to}`,
				Prisma.sql`(${Prisma.join(
					[
						Prisma.sql`sta."endDate" IS NULL`,
						Prisma.sql`sta."endDate" > ${range.from}`,
					],
					' OR '
				)})`,
			]),
		' AND '
	)
}

function getRequestPart(filter: Filter) {
	const { field, operation, value } = filter
	switch (field) {
		case 'tags':
			// Case insensitive search with trimming spaces
			return Prisma.sql`
			ARRAY[${Prisma.join(value.map((t) => t.toLowerCase()))}] && (
				select
					ARRAY_AGG(trim(lower(tag))) tags
				from (
					select id, unnest(tags) tag
					from students
				) as st
				where s.id = st.id
				group by id
			)
			`
		case 'name':
			return Prisma.sql`LOWER(s.name) ${stringOperations(operation, value)}`
		case 'group':
			return Prisma.sql`s.id IN (
				SELECT "participantId" FROM "studentsToActivities" WHERE "activityId" IN (
					${Prisma.join(value, ',')}
				)
			)`
		default:
			throw new Error(`Unknown field: ${field}`)
	}
}

function stringOperations(operation: StringOperations, value: string) {
	switch (operation) {
		case 'contains':
			return Prisma.sql`LIKE LOWER(${`%${value.toLowerCase()}%`})`
		case 'startsWith':
			return Prisma.sql`LIKE LOWER(${`${value.toLowerCase()}%`})`
		case 'endsWith':
			return Prisma.sql`LIKE LOWER(${`%${value.toLowerCase()}`})`
		default:
			throw new Error(`Unknown operation: ${operation}`)
	}
}

type StringOperations = 'contains' | 'startsWith' | 'endsWith'

type QueryResult = {
	id: number
	name: string
	tags: string[]
	outerId: string
	startDate: string
	endDate: string
	activityId: number
	activityOuterId: string
	activityName: string
	activityDeleted: boolean
	activityArchived: boolean
	performerId: number
	performerName: string
}

type Range = { from: Date; to: Date }
