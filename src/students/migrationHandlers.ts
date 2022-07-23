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
		preHandler: [app.verifyJWT],
		handler: async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const client = await app.pg.connect()

			const { email, uid } = decodedToken
			const user = await getUserByOuterId(client, uid)
			req.log.info(`Migrating students. Initiator: ${uid}`)
			const result = await migrateStudents(client, user)

			const message = `Students migration finished. Migrated ${result} students.`

			req.log.info(message)

			reply.status(200).send(message)
		},
	})
}
