import { FastifyInstance } from 'fastify'
import { getUserByOuterId } from '../dal/getUserByOuterId'
import { getDecodedToken } from '../utils/request-context'
import { migrateStudents } from './businessLayer/migrateStudents'

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

			try {
				const { name, id } = req.user
				req.log.info(`Migrating students. Initiator: ${name} (${id})`)
				const result = await migrateStudents(client, req.user)

				const message = `Students migration finished. Migrated ${result} students.`

				req.log.info(message)

				reply.status(200).send(message)
			} finally {
				client.release()
			}
		},
	})
}
