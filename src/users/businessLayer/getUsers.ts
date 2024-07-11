import { prisma } from '../../utils/prisma'

export async function getUsers(orgId: number) {
	const u2oArray = await prisma.usersToOrganizations.findMany({
		where: {
			organizationId: orgId,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					outerId: true,
				},
			},
		},
	})

	return u2oArray.map((u2o) => ({
		...u2o.user,
		role: u2o.role,
		nameInOrganization: u2o.name,
	}))
}
