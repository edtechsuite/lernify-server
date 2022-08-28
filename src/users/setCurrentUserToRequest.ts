import { FastifyInstance } from 'fastify'
import { verifyIdToken } from '../auth/firebase'
import { getUserByOuterId } from '../dal/getUserByOuterId'

export function setCurrentUserToRequest(app: FastifyInstance) {
	app.decorateRequest('user', null)
	app.decorateRequest('decodedIdToken', null)

	app.addHook('preHandler', async (request) => {
		const idToken = request.headers['authorization']
		if (!idToken) {
			app.log.info(`Auth preHandler: anonymous request`)
			return
		}
		const pool = await app.pg.pool

		try {
			const decodedToken = await verifyIdToken(idToken)
			const { uid } = decodedToken

			const user = await getUserByOuterId(pool, uid)

			app.log.info(
				`Auth preHandler: Current user was successfully set (id: ${user.id}, name: ${user.name})`
			)
			request.user = user
			request.decodedIdToken = decodedToken
		} catch (error) {
			app.log.info(`Auth preHandler: Can't set current user`)
			app.log.info(error)
		}
	})
}
