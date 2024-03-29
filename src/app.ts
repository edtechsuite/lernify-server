import { cert, initializeApp } from 'firebase-admin/app'
import { getConfig } from './config'
import authService from './auth/index'
import organizationsService from './organizations'
import studentsService from './students'
import activitiesService from './activities'
import reportsService from './reports'
import usersService from './users'
import profilesService from './profiles'
import { setProfileToRequest } from './profiles/setProfileToRequest'
import { testConnection } from './utils/postgres'
import { CLIENT_EMAIL, PRIVATE_KEY, PROJECT_ID } from './auth/config'
import { decorateWithAuth } from './auth/authDecorators'
import { decorateOrgPermission } from './auth/orgAccessDecorator'
import { databaseConnector } from './databaseConnector'
import { setCurrentUserToRequest } from './users/setCurrentUserToRequest'
import { setCurrentOrganizationToRequest } from './organizations/setCurrentOrganizationToRequest'
import { Mailer } from './messaging'
import { server } from './server'
import { dumpMaker } from './dumpMaker'
// https://github.com/ajv-validator/ajv
// https://github.com/sinclairzx81/typebox

export async function App() {
	// TODO: move to separate plugin
	initializeApp({
		credential: cert({
			projectId: PROJECT_ID,
			clientEmail: CLIENT_EMAIL,
			privateKey: PRIVATE_KEY,
		}),
	})
	const envToLogger: Record<string, any> = {
		development: {
			transport: {
				target: 'pino-pretty',
				options: {
					translateTime: 'HH:MM:ss Z',
					ignore: 'pid,hostname',
				},
			},
		},
		production: true,
		test: false,
	}
	const app = server
	app.log.info('Initializing an application')

	const config = getConfig()
	app.register(databaseConnector, {
		connectionString: config.dbConnectionString,
	})

	app.after(async () => {
		await testConnection(app)
		app.log.info('Database connection successful')
	})
	app.register(require('@fastify/cors'))

	// These decorators should be initialized before other handlers
	// TODO: use plugin
	decorateWithAuth(app)
	decorateOrgPermission(app)
	setCurrentUserToRequest(app)
	// Should be initialized after `setCurrentUserToRequest`
	setCurrentOrganizationToRequest(app)
	// Should be initialized after `setCurrentOrganizationToRequest`
	setProfileToRequest(app)

	// Mail service
	const mailer = new Mailer()
	app.decorateRequest('mailer', mailer)

	await app.register(authService, { prefix: '/auth' })

	await app.register(usersService, { prefix: '/users' })
	await app.register(profilesService, { prefix: '/profiles' })

	await app.register(organizationsService, { prefix: '/organizations' })
	await app.register(studentsService, { prefix: '/students' })
	await app.register(activitiesService, { prefix: '/activities' })
	await app.register(reportsService, { prefix: '/report' })

	await app.register(dumpMaker, { prefix: '/dump' })

	app.after(routes)

	function routes() {
		app.get('/ping', async function (req, reply) {
			reply.status(200)
			return reply.send('OK')
		})
	}

	return app
}
