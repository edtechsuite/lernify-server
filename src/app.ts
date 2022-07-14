import fastify from 'fastify'
import fastifyAuth from '@fastify/auth'
import fastifyPostgres from '@fastify/postgres'
import { fastifyRequestContextPlugin } from '@fastify/request-context'
import { cert, initializeApp } from 'firebase-admin/app'
import { dbConnectionString, isProduction, PORT } from './config'
import authService from './auth/index'
import organizationsService from './organizations'
import usersService from './users'
import { testConnection } from './utils/postgres'
import { CLIENT_EMAIL, PRIVATE_KEY, PROJECT_ID } from './auth/config'
import { decorateWithAuth } from './auth/authDecorators'
import { decorateOrgPermission } from './auth/orgAccessDecorator'

// https://github.com/ajv-validator/ajv
// https://github.com/sinclairzx81/typebox

export async function initApp() {
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
		ssl: {
			rejectUnauthorized: false,
		},
	})
	app.after(async () => {
		await testConnection(app)
		app.log.info('Database connection successful')
	})
	app.register(require('@fastify/cors'))
	app.register(fastifyAuth)

	// These decorators should be initialized before other handlers
	decorateWithAuth(app)
	decorateOrgPermission(app)

	await app.register(authService, { prefix: '/auth' })

	await app.register(organizationsService, { prefix: '/organizations' })

	await app.register(usersService, { prefix: '/users' })

	app.after(routes)

	function routes() {
		app.get('/ping', async function (req, reply) {
			reply.status(200)
			return reply.send('OK')
		})
	}

	app.listen(PORT, '0.0.0.0')
}
