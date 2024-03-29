import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { verifyIdToken } from './firebase'

export function decorateWithAuth(app: FastifyInstance) {
	// verifyJWT
	app.decorate(
		'verifyJWT',
		async (request: FastifyRequest, reply: FastifyReply) => {
			app.log.info('verifyJWT: Initiating verifying')
			const idToken = request.headers['authorization']

			if (!idToken || !request.user) {
				return reply.status(401).send('Unauthorized')
			}

			try {
				await verifyIdToken(idToken)
			} catch (error) {
				return reply.status(401).send(error)
			}
		}
	)

	app.decorate(
		'ensureUserExists',
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (!request.user) {
				return reply.status(401).send('Unauthorized')
			}
		}
	)

	app.decorate(
		'ensureUserIsSystemAdmin',
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (!request.user) {
				return reply.status(401).send('Unauthorized')
			}
			const { systemRole } = request.user
			if (systemRole !== 'system-administrator') {
				return reply.status(403).send('Forbidden')
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
