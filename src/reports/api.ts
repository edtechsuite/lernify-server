import { Type } from '@sinclair/typebox'
import { reportByStudentsTags } from './domain'
import { ServerWithTypes } from '../server'
import { reportPreview } from './domain/reportPreview'
import { reportByFilter } from './domain/reportByFilter'
import { getDescendantUnitIds } from '../dal/organizationUnits'
import { prisma } from '../utils/prisma'

export function initHandlers(app: ServerWithTypes) {
	app.get<{
		Querystring: {
			from?: string
			to?: string
			tags?: string | string[]
			order?: 'asc' | 'desc'
			orderBy?: 'rate' | 'participantName' | 'activityName'
		}
	}>(
		'/',
		{
			preHandler: [app.verifyJWT],
			schema: {
				querystring: {
					type: 'object',
					properties: {
						from: { type: 'string' },
						to: { type: 'string' },
						order: { enum: ['asc', 'desc'] },
						orderBy: { enum: ['rate', 'participantName', 'activityName'] },
					},
				},
			},
		},
		async (req) => {
			const { organization } = req
			const { from, to, tags = [], order, orderBy } = req.query
			if (!from || !to) {
				throw new Error('`from` and `to` are required')
			}
			const fromDate = new Date(from)
			const toDate = new Date(to)
			if (!fromDate || !toDate) {
				throw new Error('Invalid date format')
			}
			if (fromDate > toDate) {
				throw new Error('`from` must be less than `to`')
			}

			// Temporary disabled due to issues with another solution

			// const oneMonth = 1000 * 60 * 60 * 24 * 31
			// const oneMonthAndOneDay = oneMonth + 1000 * 60 * 60 * 24
			// if (toDate.getTime() - fromDate.getTime() > oneMonthAndOneDay) {
			// 	throw new Error('Date range must be less than 31 days')
			// }

			return reportByStudentsTags(
				organization!.key,
				{
					from: new Date(from),
					to: new Date(to),
				},
				typeof tags === 'string' ? [tags] : tags,
				order,
				orderBy,
			)
		},
	)

	app.post(
		'/preview',
		{
			schema: {
				body: PreviewSchema,
			},
		},
		async (req) => {
			const { filters, page, pageSize, from, to } = req.body
			const fromDate = new Date(from)
			const toDate = new Date(to)
			if (!fromDate || !toDate) {
				throw new Error('Invalid date format')
			}
			const result = await reportPreview(
				req.organization!.id,
				filters,
				{ from: new Date(from), to: new Date(to) },
				{
					page: page ?? 0,
					pageSize: pageSize ?? 10,
				},
			)
			return result
		},
	)

	app.post(
		'/byFilter',
		{
			schema: {
				body: ReportSchema,
			},
		},
		async (req) => {
			const { filters, from, to, organizationalUnitId, includeDescendants } =
				req.body
			const fromDate = new Date(from)
			const toDate = new Date(to)
			if (!fromDate || !toDate) {
				throw new Error('Invalid date format')
			}

			let resolvedFilters = [...filters]

			if (organizationalUnitId) {
				const orgId = req.organization!.id
				// Auth: verify unit belongs to this organization
				const unit = await prisma.organizationUnit.findFirst({
					where: { id: organizationalUnitId, organizationId: orgId },
				})
				if (!unit) {
					throw new Error('Organizational unit not found or not authorized')
				}

				const unitIds = includeDescendants
					? await getDescendantUnitIds(organizationalUnitId)
					: [organizationalUnitId]

				resolvedFilters = resolvedFilters.concat([
					{
						field: 'organizationUnit' as const,
						value: unitIds,
						operation: 'is' as const,
					},
				])
			}

			return reportByFilter(req.organization!, resolvedFilters, {
				from: fromDate,
				to: toDate,
			})
		},
	)
}

const FilterSchema = Type.Array(
	Type.Union([
		Type.Object({
			field: Type.Literal('tags'),
			value: Type.Array(Type.String()),
			operation: Type.Union([Type.Literal('contains')]),
		}),
		Type.Object({
			field: Type.Literal('name'),
			value: Type.String(),
			operation: Type.Union([
				Type.Literal('contains'),
				Type.Literal('startsWith'),
				Type.Literal('endsWith'),
			]),
		}),
		Type.Object({
			field: Type.Literal('group'),
			value: Type.Array(Type.Number()),
			operation: Type.Union([Type.Literal('is')]),
		}),
		Type.Object({
			field: Type.Literal('organizationUnit'),
			value: Type.Array(Type.String()),
			operation: Type.Union([Type.Literal('is')]),
		}),
	]),
)
const PreviewSchema = Type.Object({
	filters: FilterSchema,
	page: Type.Optional(Type.Number()),
	pageSize: Type.Optional(
		Type.Number({
			minimum: 1,
			maximum: 100,
		}),
	),
	from: Type.String(),
	to: Type.String(),
	organizationalUnitId: Type.Optional(Type.String()),
	includeDescendants: Type.Optional(Type.Boolean()),
})
const ReportSchema = Type.Object({
	filters: FilterSchema,
	from: Type.String(),
	to: Type.String(),
	organizationalUnitId: Type.Optional(Type.String()),
	includeDescendants: Type.Optional(Type.Boolean()),
})
