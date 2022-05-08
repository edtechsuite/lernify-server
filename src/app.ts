import fastify from 'fastify'
import fastifyAuth from '@fastify/auth'
import { fastifyRequestContextPlugin } from '@fastify/request-context'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { isProduction, PORT } from './config'
import authService from './auth'

// https://github.com/ajv-validator/ajv
// https://github.com/sinclairzx81/typebox

export function initApp() {
	initializeApp({
		credential: applicationDefault(),
	})
	const app = fastify({
		logger: {
			prettyPrint: !isProduction
				? {
						translateTime: 'yyyy-mm-dd HH:MM:ss Z',
						ignore: 'pid,hostname',
				  }
				: false,
		},
		// ajv: {},
	})

	app.register(fastifyRequestContextPlugin, {
		hook: 'preHandler',
		defaultStoreValues: {
			decodedIdToken: {},
		},
	})

	app.register(fastifyAuth)

	// Auth service should be initialized before other handlers
	app.register(authService, { prefix: '/auth' })

	app.after(routes)

	function routes() {
		app.get('/ping', async function (req, reply) {
			reply.status(200)
			return reply.send('OK')
		})
	}

	app.listen(PORT)
}
