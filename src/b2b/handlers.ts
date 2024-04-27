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
				querystring: ParticipantsSchema,
			},
		},
		async (req) => {
			// TODO: check permissions of token
			const { page = 0, pageSize = 10 } = req.query
			const [list, total] = await getParticipants({
				page,
				pageSize,
				organization: req.b2bOrganization!.id,
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

const ParticipantsSchema = Type.Object({
	...paginationSchemaPart,
})
