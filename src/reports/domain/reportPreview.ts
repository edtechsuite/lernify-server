import { Prisma } from '@prisma/client'
import { prisma } from '../../utils/prisma'

export async function reportPreview(
	orgKey: string,
	filters: Filter[],
	config: Config
) {
	if (filters.length === 0) {
		// No filters, return all records
		return prisma.students.findMany({
			where: {
				organizationRecord: {
					key: orgKey,
				},
			},
			// TODO: add order
			// orderBy: {
			// },
			skip: config.page * config.pageSize,
			take: config.pageSize,
		})
	}
	const filtersQuery = Prisma.join(
		filters.map((f) => getRequestPart(f)),
		' AND '
	)

	return await prisma.$queryRaw`SELECT * FROM students WHERE ${filtersQuery} AND organization = (SELECT id FROM organizations where key = ${orgKey});`
}

type Filter = TagFilter | NameFilter
type TagFilter = {
	field: 'tags'
	value: string[]
	operation: 'contains'
}
type NameFilter = {
	field: 'name'
	value: string
	operation: 'contains'
}

type Config = {
	// order: 'asc' | 'desc'
	// orderBy: string
	page: number
	pageSize: number
}
function getRequestPart(filter: Filter) {
	const { field, operation, value } = filter
	switch (field) {
		case 'tags':
			return Prisma.sql`ARRAY[${Prisma.join(
				value.map((t) => t.toLowerCase())
			)}] && lower(tags::text)::text[]`
		case 'name':
			return Prisma.sql`LOWER(name) ${stringOperations(operation, value)}`
		default:
			throw new Error(`Unknown field: ${field}`)
	}
}

function stringOperations(operation: StringOperations, value: string) {
	switch (operation) {
		case 'contains':
			return Prisma.sql`LIKE LOWER(${`%${value}%`})`
		case 'startsWith':
			return Prisma.sql`LIKE LOWER(${`${value}%`})`
		case 'endsWith':
			return Prisma.sql`LIKE LOWER(${`%${value}`})`
		default:
			throw new Error(`Unknown operation: ${operation}`)
	}
}

type StringOperations = 'contains' | 'startsWith' | 'endsWith'
