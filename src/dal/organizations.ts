import { Pool } from 'pg'
import { OrganizationRecord } from '../organizations/types'

export async function getOrganizationByIdQuery(client: Pool, id: number) {
	return await client.query<OrganizationRecord>(
		`SELECT * FROM "organizations"
		WHERE "id" = $1`,
		[id]
	)
}

export async function getOrganizationByKeyQuery(client: Pool, key: string) {
	return await client.query<OrganizationRecord>(
		`SELECT * FROM "organizations"
		WHERE "key" = $1`,
		[key]
	)
}

export async function getAllOrganization(pool: Pool) {
	return await pool.query<OrganizationRecord>(`SELECT * FROM "organizations"`)
}

export async function checkOrgPermissions(
	client: Pool,
	userOuterId: string,
	orgKey: string
) {
	const result = await client.query(
		`SELECT * FROM "usersToOrganizations"
			WHERE "userId" = (SELECT "id" FROM "users" WHERE "outerId"=$1) AND "organizationId" = (SELECT "id" FROM "organizations" WHERE "key"=$2)`,
		[userOuterId, orgKey]
	)

	return result.rows.length > 0
}
