import { FastifyInstance } from 'fastify'
import { initDecorators } from './decorators'
import { initHandlers } from './handlers'

export default (app: FastifyInstance, opts: any, done: () => void) => {
	const decoratedApp = initDecorators(app)

	initHandlers(decoratedApp)

	decoratedApp.log.info('"b2b" service initialized')

	done()
}
