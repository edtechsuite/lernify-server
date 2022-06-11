import { FastifyInstance } from 'fastify'
import { getDecodedToken } from '../utils/request-context'

export function initHandlers(app: FastifyInstance) {
	// GET /all by user
	app.route({
		method: 'GET',
		url: `/`,
		schema: {
			headers: {
				Authorization: { type: 'string' },
			},
		},
		preHandler: [app.verifyJWT],
		handler: async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const client = await app.pg.connect()

			try {
				const result = await client.query(
					`SELECT * FROM "organizations"
						INNER JOIN "usersToOrganizations" ON "organizations"."id" = "usersToOrganizations"."organizationId"
						WHERE "usersToOrganizations"."userId" = (SELECT "id" FROM "users" WHERE "outerId"=$1)`,
					[decodedToken.uid]
				)
				reply.send(result.rows)
			} catch (error: any) {
				throw error
			} finally {
				client.release()
			}
		},
	})
}
