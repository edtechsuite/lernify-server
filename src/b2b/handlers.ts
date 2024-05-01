import { Type } from '@sinclair/typebox'
import { B2BFastifyInstance } from './decorators'
import { paginationSchemaPart } from '../utils/requestCommon'
import { getParticipants } from './domain.ts/participant'

export function initB2BTokenProtected(app: B2BFastifyInstance) {
	app.addHook('preHandler', app.auth([app.verifyApiToken]))

	app.get(
		'/participants',
		{
			schema: {
				description:
					'Returns a list of participants with activities and attendance rate',
				tags: ['participants'],
				summary: 'Get participants with related data',
				security: [{ apiKey: [] }],
				response: {
					200: participantsResponseSchema,
				},

				querystring: participantsQsSchema,
			},
		},
		async (req) => {
			// TODO: check permissions of token
			const { page = 0, pageSize = 10 } = req.query
			const [list, total] = await getParticipants({
				page,
				pageSize,
				organization: req.b2bOrganization!,
			})

			return {
				list,
				page,
				pageSize,
				total,
			}
		}
	)
}

const participantsQsSchema = Type.Object({
	...paginationSchemaPart,
})

const participantsResponseSchema = Type.Object({
	page: Type.Number(),
	pageSize: Type.Number({
		minimum: 1,
		maximum: 100,
	}),
	total: Type.Number(),
	list: Type.Array(
		Type.Object({
			activities: Type.Array(
				Type.Object({
					id: Type.Number(),
					name: Type.String(),
					performer: Type.Union([
						Type.Object({
							id: Type.Number(),
							name: Type.String(),
							email: Type.String(),
						}),
						Type.Null(),
					]),
					rate: Type.Number(),
					attended: Type.Number(),
					total: Type.Number(),
				})
			),
			tags: Type.Array(Type.String()),
			id: Type.Number(),
			name: Type.String(),
		})
	),
})
