import { FastifyInstance } from 'fastify'
import { getProfile, getProfiles, updateProfile } from './domain'
import { ForbiddenError } from '../utils/errors'

export function initHandlers(app: FastifyInstance) {
	// TODO: use this approach to protect routes
	// app.addHook('preHandler', app.auth([app.verifyJWT]))

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
			const { profile } = req

			try {
				return updateProfile(profile, id, { name })
			} catch (error) {
				if (error instanceof ForbiddenError) {
					reply.status(403)
					return reply.send('Forbidden')
				}
				throw error
			}
		}
	)

	app.get<{
		Querystring: {
			deleted?: string
		}
	}>(
		'/',
		{
			preHandler: [app.verifyJWT],
		},
		async (req) => {
			const { organization } = req
			const { deleted } = req.query
			const profiles = getProfiles(organization!.id, deleted === 'true')
			return profiles
		}
	)

	app.get(
		'/me',
		{
			preHandler: [app.verifyJWT],
		},
		async (req) => {
			// TODO: `profile` will not be there if organization is not set
			const { id } = req.profile!
			const profiles = getProfile(id)
			return profiles
		}
	)

	app.get<{
		Params: {
			id: string
		}
	}>(
		'/:id',
		{
			preHandler: [app.verifyJWT],
		},
		async (req) => {
			const { id } = req.params
			const profiles = getProfile(parseInt(id, 10))
			return profiles
		}
	)
}
