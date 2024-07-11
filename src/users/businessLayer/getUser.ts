import { prisma } from '../../utils/prisma'

export async function getUserOfOrganization(id: number, orgId: number) {
	const u2o = await prisma.usersToOrganizations.findFirstOrThrow({
		where: {
			organizationId: orgId,
			userId: id,
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

	return {
		...u2o.user,
		role: u2o.role,
		nameInOrganization: u2o.name,
	}
}
