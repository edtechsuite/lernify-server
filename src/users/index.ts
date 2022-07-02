import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { initHandlers } from './handlers'

export default (app: FastifyInstance, opts: any, done: () => void) => {
	initHandlers(app)

	app.log.info('"Users" service initialized')

	done()
}
