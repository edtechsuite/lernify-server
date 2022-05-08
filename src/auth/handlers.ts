import { FastifyInstance } from 'fastify'
import { getDecodedToken } from '../utils/request-context'
import { getUserProfile } from './firebase'

export function initHandlers(app: FastifyInstance) {
	app.route({
		method: 'GET',
		url: `/me`,
		schema: {
			headers: {
				Authorization: { type: 'string' },
			},
		},
		preHandler: [app.verifyJWT],
		handler: async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const profile = await getUserProfile(decodedToken.uid)
			reply.send(profile)
		},
	})
}
