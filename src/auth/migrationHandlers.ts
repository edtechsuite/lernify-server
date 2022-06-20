import { FastifyInstance } from 'fastify'
import { getDecodedToken } from '../utils/request-context'
import { migrateUsers } from './logic/migrateUsers'

export function initMigrationHandlers(app: FastifyInstance) {
	app.route({
		method: 'POST',
		url: `/migrate`,
		schema: {
			headers: {
				Authorization: { type: 'string' },
			},
		},
		preHandler: [app.verifyJWT],
		handler: async (req, reply) => {
			const decodedToken = getDecodedToken(req)

			const { uid } = decodedToken
			req.log.info(`Migrating users. Initiator: ${uid}`)
			const result = await migrateUsers(app)
			req.log.info(
				`Users migration finished. Migrated ${result.rowCount} users`
			)

			reply
				.status(200)
				.send(`Users migration finished. Migrated ${result.rowCount} users`)
		},
	})
}
