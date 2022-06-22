import { FastifyInstance } from 'fastify'
import { PoolClient } from 'pg'

export async function removeOrganization(
	app: FastifyInstance,
	userId: string,
	orgId: string
) {
	return app.pg.transact(async (client) => {
		const result = await removeOrganizationQuery(client, userId, orgId)

		return result
	})
}

async function removeOrganizationQuery(
	client: PoolClient,
	userId: string,
	orgId: string
) {
	return client.query(
		`UPDATE organizations
			SET "deleted" = TRUE, "updatedBy" = (SELECT id FROM users WHERE "outerId" = $1), "updatedAt" = CURRENT_TIMESTAMP
			WHERE "id" = $2 RETURNING *`,
		[userId, orgId]
	)
}
