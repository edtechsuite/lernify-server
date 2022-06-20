import { FastifyInstance } from 'fastify'
import { getDecodedToken } from '../utils/request-context'
import { migrateOrganizations } from './businessLayer/migrateOrganizations'

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

			const { email, uid } = decodedToken
			req.log.info(`Migrating organizations. Initiator: ${uid}`)
			const result = await migrateOrganizations(app)

			req.log.info(
				`Organizations migration finished. Migrated ${result.rowCount} organizations`
			)

			reply
				.status(200)
				.send(
					`Organizations migration finished. Migrated ${result.rowCount} organizations`
				)
		},
	})
}
