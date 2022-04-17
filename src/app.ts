import fastify from 'fastify'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { PORT } from './config'
import { initHandlers } from './handlers'
import { createLogger } from './logger'

export function initApp() {
	const logger = createLogger('application')

	initializeApp({
		credential: applicationDefault(),
	})
	const app = fastify()

	app.get('/ping', async function (req, reply) {
		return reply.code(200)
	})

	initHandlers(app)

	app.listen(PORT)

	app.ready(() => {
		logger.log('info', `Application is started and listen on port ${PORT}`)
	})
}
