import { FastifyInstance } from 'fastify'
import { initHandlers } from './handlers'
import { initMigrationHandlers } from './migrationHandlers'

export default (app: FastifyInstance, opts: any, done: () => void) => {
	initHandlers(app)
	initMigrationHandlers(app)

	app.log.info('Auth service initialized')

	done()
}
