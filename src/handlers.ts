import { FastifyInstance } from 'fastify'
import { initGraphQLInterface } from './graphql'

export function initHandlers(app: FastifyInstance) {
	initGraphQLInterface(app)

	app.get('/health', async function (req, reply) {
		return reply.send()
	})
}
