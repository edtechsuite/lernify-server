import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { getUserByOuterId } from '../dal/getUserByOuterId'
import { verifyIdToken } from './firebase'
import { initHandlers } from './handlers'
import { initMigrationHandlers } from './migrationHandlers'

function authPlugin(app: FastifyInstance, opts: any, done: () => void) {
	app.addHook('preHandler', async (request, reply) => {
		const idToken = request.headers['authorization']
		if (!idToken) {
			return
		}
		try {
			const decodedToken = await verifyIdToken(idToken)
			const client = await app.pg.connect()

			const { uid } = decodedToken
			const user = await getUserByOuterId(client, uid)

			request.user = user
			request.decodedIdToken = decodedToken
		} catch (error) {}
	})

	initHandlers(app)
	initMigrationHandlers(app)

	app.log.info('Auth service initialized')

	done()
}

export default fastifyPlugin(authPlugin)
