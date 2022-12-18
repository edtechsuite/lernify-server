import { FastifyInstance } from 'fastify'
import { migrateGroups } from './businessLayer/migrateGroups'

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
				return reply.code(401).send('Unauthorized')
			}
			const client = await app.pg.connect()
			const pool = await app.pg.pool

			try {
				const { name, id } = req.user
				req.log.info(`Migrating groups. Initiator: ${name} (${id})`)
				const result = await migrateGroups(pool, req.user)

				const message = `Groups migration finished. Migrated ${result.groupsCount} groups and assigned ${result.studentsToGroupsCount} students`

				req.log.info(message)

				reply.status(200).send(message)
			} finally {
				client.release()
			}
		},
	})
}
