import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { verifyIdToken } from './firebase'
import { initHandlers } from './handlers'

export default (app: FastifyInstance, opts: any, done: () => void) => {
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

	initHandlers(app)

	app.log.info('Auth service initialized')

	done()
}
