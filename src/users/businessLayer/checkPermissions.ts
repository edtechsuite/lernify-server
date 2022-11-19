import { PoolClient } from 'pg'

// TODO: use `verifyOrgAccess`
export async function checkPermissions(
	client: PoolClient,
	userOuterId: string,
	// TODO: number
	orgId: string
) {
	const result = await client.query(
		`SELECT * FROM "usersToOrganizations"
			WHERE "userId" = (SELECT "id" FROM "users" WHERE "outerId"=$1) AND "organizationId" = $2`,
		[userOuterId, orgId]
	)

	return result.rows.length > 0
}
