import { Pool } from 'pg'
import { OrganizationRecord } from '../organizations/types'

export async function getOrganizationByIdQuery(client: Pool, id: number) {
	return await client.query<OrganizationRecord>(
		`SELECT * FROM "organizations"
		WHERE "id" = $1`,
		[id]
	)
}

export async function getAllOrganization(pool: Pool) {
	return await pool.query<OrganizationRecord>(`SELECT * FROM "organizations"`)
}

export async function checkOrgPermissions(
	client: Pool,
	userOuterId: string,
	orgId: number
) {
	const result = await client.query(
		`SELECT * FROM "usersToOrganizations"
			WHERE "userId" = (SELECT "id" FROM "users" WHERE "outerId"=$1) AND "organizationId" = $2`,
		[userOuterId, orgId]
	)

	return result.rows.length > 0
}
