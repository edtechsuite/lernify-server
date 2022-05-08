import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { verifyIdToken } from './firebase'
import { initHandlers } from './handlers'

export default (app: FastifyInstance, opts: any, done: () => void) => {
	app.decorate(
		'verifyJWT',
		async (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
			const idToken = request.headers['authorization']

			if (!idToken) {
				return reply.status(401).send('Unauthorized')
			}

			try {
				const decodedToken = await verifyIdToken(idToken)
				request.requestContext.set('decodedIdToken', decodedToken)
			} catch (error) {
				return reply.status(401).send(error)
			}

			done()
		}
	)

	initHandlers(app)

	app.log.info('Auth service initialized')

	done()
}
