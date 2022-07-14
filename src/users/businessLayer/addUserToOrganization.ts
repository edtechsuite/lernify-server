import { PoolClient } from 'pg'
import { assignUserToOrganizationQuery } from '../../dal/users2organizations'
import { createUserInOrganization } from '../../firebase/organizations'

export async function addUserToOrganization(
	client: PoolClient,
	orgId: number,
	orgKey: string,
	outerUserId: string,
	userId: number,
	role: string
) {
	const result = await assignUserToOrganizationQuery(client, {
		orgId: orgId,
		role: role,
		updatedBy: userId,
		userId,
	})

	await createUserInOrganization(orgKey, {
		id: outerUserId,
	})

	return result
}
