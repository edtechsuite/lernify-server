import { FastifyInstance } from 'fastify'
import { B2BFastifyInstance, initDecorators } from './decorators'
import { initUsersAuthProtectedHandlers } from './usersHandlers'
import { initB2BTokenProtected } from './handlers'
import { initiateOpenApi } from './openApi'

export default async (app: FastifyInstance, opts: any) => {
	const decoratedApp = initDecorators(app)

	initUsersAuthProtectedHandlers(decoratedApp)
	await initiateOpenApi(decoratedApp)

	decoratedApp.register((app, _, done) => {
		initB2BTokenProtected(app as B2BFastifyInstance)
		done()
	})

	decoratedApp.log.info('"b2b" service initialized')
}
