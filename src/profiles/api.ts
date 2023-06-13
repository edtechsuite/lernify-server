import { FastifyInstance } from 'fastify'
import { getProfiles, updateProfile } from './domain'
import { ForbiddenError } from '../utils/errors'

export function initHandlers(app: FastifyInstance) {
	app.put<{
		Body: {
			name: string
		}
		Params: {
			id: number
		}
	}>(
		'/:id',
		{
			schema: {
				body: {
					type: 'object',
					required: ['name'],
					properties: {
						name: { type: 'string' },
					},
				},
				params: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'number' },
					},
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const { name } = req.body
			const { id } = req.params
			const { user } = req

			try {
				return updateProfile(user, id, { name })
			} catch (error) {
				if (error instanceof ForbiddenError) {
					reply.status(403)
					return reply.send('Forbidden')
				}
			}
		}
	)

	app.get<{
		Params: {
			deleted: boolean
		}
	}>(
		'/',
		{
			preHandler: [app.verifyJWT],
		},
		async (req) => {
			const { organization } = req
			const { deleted } = req.params
			const profiles = getProfiles(organization!.id, deleted)
			return profiles
		}
	)
}
