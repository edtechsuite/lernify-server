import { FastifyInstance } from 'fastify'
import { verifyIdToken } from '../auth/firebase'
import { getUserByOuterId } from '../dal/getUserByOuterId'

export function setCurrentUserHook(app: FastifyInstance) {
	app.addHook('preHandler', async (request) => {
		app.log.info('preHandler: Setting current user')
		const idToken = request.headers['authorization']
		if (!idToken) {
			return
		}
		app.log.info('preHandler: connecting to database')
		const client = await app.pg.connect()

		try {
			app.log.info('preHandler: verifying "IdToken"')
			const decodedToken = await verifyIdToken(idToken)
			const { uid } = decodedToken

			app.log.info('preHandler: fetching user by "outerId"')
			const user = await getUserByOuterId(client, uid)

			app.log.info('preHandler: Current user was successfully set')
			request.user = user
			request.decodedIdToken = decodedToken
		} catch (error) {
		} finally {
			app.log.info('preHandler: Closing database connection')
			client.release()
		}
	})
}
