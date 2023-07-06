import { Pool } from 'pg'
import { assignUserToOrganizationQuery } from '../../dal/users2organizations'
import { createUserInOrganizationFB } from '../../firebase/organizations'
import { prisma } from '../../utils/prisma'

export async function addUserToOrganization(
	orgId: number,
	orgKey: string,
	outerUserId: string,
	userId: number,
	role: string,
	name: string
) {
	const result = await prisma.usersToOrganizations.create({
		data: {
			userId,
			role,
			organizationId: orgId,
			// TODO: probably need to use some kind of `subject` here
			updatedBy: userId,
			name,
		},
	})

	await createUserInOrganizationFB(orgKey, {
		id: outerUserId,
	})

	return result
}
