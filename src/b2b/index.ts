import { FastifyInstance } from 'fastify'
import { B2BFastifyInstance, initDecorators } from './decorators'
import { initUsersAuthProtectedHandlers } from './usersHandlers'
import { initB2BTokenProtected } from './handlers'

export default (app: FastifyInstance, opts: any, done: () => void) => {
	const decoratedApp = initDecorators(app)

	initUsersAuthProtectedHandlers(decoratedApp)

	decoratedApp.register((app, _, done) => {
		initB2BTokenProtected(app as B2BFastifyInstance)
		done()
	})

	decoratedApp.log.info('"b2b" service initialized')

	done()
}
