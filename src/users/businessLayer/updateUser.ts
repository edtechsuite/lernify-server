import { prisma } from '../../utils/prisma'

export async function updateUser(
	orgId: number,
	id: number,
	data: UserUpdateParams
) {
	const record = await prisma.usersToOrganizations.findFirstOrThrow({
		where: {
			organizationId: orgId,
			userId: id,
		},
	})
	const updated = await prisma.usersToOrganizations.update({
		where: {
			id: record.id,
		},
		data: {
			name: data.nameInOrganization,
			role: data.role,
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
		...updated.user,
		role: updated.role,
		nameInOrganization: updated.name,
	}
}

type UserUpdateParams = {
	nameInOrganization: string
	role: string
}
