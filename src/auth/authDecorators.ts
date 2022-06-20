import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { verifyIdToken } from './firebase'

export function decorateWithAuth(app: FastifyInstance) {
	// verifyJWT
	app.decorate(
		'verifyJWT',
		async (request: FastifyRequest, reply: FastifyReply) => {
			const idToken = request.headers['authorization']

			if (!idToken) {
				return reply.status(401).send('Unauthorized')
			}

			try {
				const decodedToken = await verifyIdToken(idToken)
				request.requestContext.set('decodedIdToken', decodedToken)
				return
			} catch (error) {
				return reply.status(401).send(error)
			}
		}
	)

	// getAuthSchema
	app.decorate('getAuthSchema', async () => {
		return {
			headers: {
				Authorization: { type: 'string' },
			},
		}
	})
}
