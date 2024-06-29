import { FastifyInstance } from 'fastify'
import { initHandlers } from './api'

export default (app: FastifyInstance, opts: any, done: () => void) => {
	initHandlers(app)

	app.log.info('"Organization Units" service initialized')

	done()
}
