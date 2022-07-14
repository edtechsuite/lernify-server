import { PoolClient } from 'pg'

type UserToOrganizationData = {
	userId: number
	orgId: number
	role: string
	updatedBy: number
}
export async function assignUserToOrganizationQuery(
	client: PoolClient,
	data: UserToOrganizationData
) {
	return await client.query(
		`INSERT INTO "usersToOrganizations" (
			"userId", "organizationId", "role", "updatedBy"
		) VALUES (
			$1,
			$2,
			$3,
			$4
		) RETURNING *`,
		[data.userId, data.orgId, data.role, data.updatedBy]
	)
}
