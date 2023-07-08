import { prisma } from '../../utils/prisma'

export async function getActivity(id: number, orgId: number) {
	const activity = await prisma.activities.findFirstOrThrow({
		where: {
			id: id,
			organizationId: orgId,
		},
	})

	if (!activity.performerId) {
		return activity
	}

	const performer = await prisma.usersToOrganizations.findFirstOrThrow({
		where: {
			userId: activity.performerId,
			organizationId: orgId,
		},
		include: {
			user: true,
		},
	})

	return { ...activity, performer: performer }
}
