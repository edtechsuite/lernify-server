import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { initHandlers } from './handlers'

export default async (app: FastifyInstance, opts: any, done: () => void) => {
	await initHandlers(app)

	app.log.info('"Users" service initialized')

	done()
}
