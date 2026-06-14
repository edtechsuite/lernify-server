import { FastifyInstance } from 'fastify'
import { initHandlers } from './api'
import { initMembershipHandlers } from './membershipApi'

export default (app: FastifyInstance, opts: any, done: () => void) => {
	initHandlers(app)
	initMembershipHandlers(app)

	app.log.info('"Organization Units" service initialized')

	done()
}
