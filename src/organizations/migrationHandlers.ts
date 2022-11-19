import { FastifyInstance } from 'fastify'
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
		preHandler: [app.ensureUserIsSystemAdmin],
		handler: async (req, reply) => {
			if (!req.user) {
				return reply.status(401).send('Unauthorized')
			}

			const { id, name } = req.user
			req.log.info(`Migrating organizations. Initiator: ${name} (${id})`)
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
