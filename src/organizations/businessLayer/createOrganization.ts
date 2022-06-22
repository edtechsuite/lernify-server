import { FastifyInstance } from 'fastify'
import { PoolClient } from 'pg'
import { OrganizationCreate } from '../types'
import { createOrganization as createOrganizationInFirebase } from '../../firebase/organizations'

export async function createOrganization(
	app: FastifyInstance,
	userId: string,
	org: OrganizationCreate
) {
	return app.pg.transact(async (client) => {
		const result = await addOrganizationQuery(client, userId, org)

		await assignUserToOrganizationQuery(client, {
			fbUserId: userId,
			orgId: result.rows[0].id,
			role: 'Administrator',
			updatedBy: userId,
		})

		await createOrganizationInFirebase(
			{
				id: org.key,
				name: org.name,
				creator: userId,
			},
			{
				id: userId,
			}
		)

		return result
	})
}

async function addOrganizationQuery(
	client: PoolClient,
	userId: string,
	org: OrganizationCreate
) {
	return client.query(
		`INSERT INTO organizations (
			key, name, owner, "updatedBy"
		) VALUES (
			$1, $2, (SELECT id FROM users WHERE "outerId"=$3), (SELECT id FROM users WHERE "outerId"=$4)
		) RETURNING *`,
		[org.key, org.name, userId, userId]
	)
}

type UserToOrganizationData = {
	fbUserId: string
	orgId: string
	role: string
	updatedBy: string
}
export async function assignUserToOrganizationQuery(
	client: PoolClient,
	data: UserToOrganizationData
) {
	return client.query(
		`INSERT INTO "usersToOrganizations" (
			"userId", "organizationId", "role", "updatedBy"
		) VALUES (
			(SELECT id FROM users WHERE "outerId"=$1),
			$2,
			$3,
			(SELECT id FROM users WHERE "outerId"=$4)
		) RETURNING *`,
		[data.fbUserId, data.orgId, data.role, data.updatedBy]
	)
}
