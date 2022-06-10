import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { initHandlers } from './handlers'
import { initMigrationHandlers } from './migrationHandlers'

// TODO: get user's organizations
// TODO: migrate organizations
// TODO: add organization

export default (app: FastifyInstance, opts: any, done: () => void) => {
	initHandlers(app)

	initMigrationHandlers(app)

	app.log.info('"Organizations" service initialized')

	done()
}
