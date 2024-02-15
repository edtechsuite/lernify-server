import { Prisma } from '@prisma/client'
import { prisma } from '../../utils/prisma'
import { Filter, PaginationConfig } from './types'

export async function getReportRecords(
	orgId: number,
	filters: Filter[],
	range: Range,
	config?: PaginationConfig
) {
	const filterSql = makeFilterSql(filters, range, orgId)
	const totalResult = await makeTotalQuery(filterSql)
	return {
		data: await makeQuery(
			filterSql,
			config?.pageSize,
			config && config.page * config.pageSize
		),
		total: totalResult[0].count,
	}
}

async function makeQuery(
	filtersQuery: Prisma.Sql,
	limit?: number,
	offset?: number
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
		u.name as "performerName"
		${getConditionQuery(filtersQuery)}
		${getPaginationQuery(limit, offset)}
	`
}
function getConditionQuery(filtersQuery: Prisma.Sql) {
	return Prisma.sql`
		FROM students AS s
		LEFT JOIN "studentsToActivities" as sta ON sta."participantId" = s.id
		LEFT JOIN "activities" as act ON sta."activityId" = act.id
		LEFT JOIN "users" as u ON act."performerId" = u.id
		WHERE ${filtersQuery}
	`
}
function getPaginationQuery(limit?: number, offset?: number) {
	return typeof limit === 'number' && typeof offset === 'number'
		? Prisma.sql`
			LIMIT ${limit}
			OFFSET ${offset}
		`
		: Prisma.empty
}

async function makeTotalQuery(filtersQuery: Prisma.Sql) {
	return await prisma.$queryRaw<[{ count: number }]>`
		-- COUNT(*) returns BigInt, but we need int to prevent failing the request
		SELECT COUNT(*)::int FROM (
			SELECT DISTINCT ON (s."id", act."id")
			s."id"
			${getConditionQuery(filtersQuery)}
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
						Prisma.sql`sta."endDate" IS NOT NULL`,
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
			return Prisma.sql`s.id IN (SELECT "participantId" FROM "studentsToActivities" WHERE "activityId" IN (SELECT id FROM "activities" WHERE LOWER("name") ${stringOperations(
				operation,
				value
			)}))`
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
