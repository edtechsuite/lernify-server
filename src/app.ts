import fastify from 'fastify'
import fastifyAuth from '@fastify/auth'
import fastifyPostgres from '@fastify/postgres'
import { fastifyRequestContextPlugin } from '@fastify/request-context'
import { cert, initializeApp } from 'firebase-admin/app'
import { dbConnectionString, isProduction, PORT } from './config'
import authService from './auth'
import { testConnection } from './utils/postgres'
import { CLIENT_EMAIL, PRIVATE_KEY, PROJECT_ID } from './auth/config'

// https://github.com/ajv-validator/ajv
// https://github.com/sinclairzx81/typebox

export function initApp() {
	console.log('=-= PRIVATE_KEY', PRIVATE_KEY)
	initializeApp({
		credential: cert({
			projectId: PROJECT_ID,
			clientEmail: CLIENT_EMAIL,
			privateKey: PRIVATE_KEY,
		}),
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
			decodedIdToken: undefined,
		},
	})
	app.register(fastifyPostgres, {
		connectionString: dbConnectionString,
	})
	app.after(async () => {
		await testConnection(app)
		app.log.info('Database connection successful')
	})
	app.register(require('@fastify/cors'))
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

	app.listen(PORT, '0.0.0.0')
}
