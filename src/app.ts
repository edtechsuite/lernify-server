import fastify from 'fastify'
import { initAuthService } from './auth'
import { PORT } from './config'
import { createLogger } from './logger'

export function initApp() {
	const logger = createLogger('application')

	initAuthService()

	const app = fastify()

	app.get('/ping', async function (req, reply) {
		return reply.code(200)
	})

	app.listen(PORT)

	app.ready(() => {
		logger.log('info', `Application is started and listen on port ${PORT}`)
	})
}
