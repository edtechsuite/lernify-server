import { getEvents } from '../../events/domain/getEvents'
import { prisma } from '../../utils/prisma'

export async function getActivity(id: number, orgId: number) {
	const activity = await prisma.activities.findFirstOrThrow({
		where: {
			id: id,
			organizationId: orgId,
		},
		include: {
			organization: {
				select: {
					key: true,
				},
			},
		},
	})

	const archivedEvent = activity.archived
		? await getArchivedEvent(activity.organization.key, activity.id)
		: undefined

	const archivedBy = archivedEvent
		? await prisma.usersToOrganizations.findFirst({
				where: {
					userId: archivedEvent.subject,
					organizationId: orgId,
				},
				select: {
					id: true,
					name: true,
				},
		  })
		: undefined

	const enhancedActivity = {
		...activity,
		archivedBy: archivedBy,
		archivedAt: archivedEvent?.date,
	}
	if (!activity.performerId) {
		return enhancedActivity
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

	return {
		...enhancedActivity,
		performer: performer,
	}
}

async function getArchivedEvent(orgKey: string, activityId: number) {
	const archivedEvents = await getEvents(
		orgKey,
		{
			type: 'activityArchivedUpdated',
			object: activityId,
		},
		{ limit: 1, offset: 0 }
	)
	return archivedEvents.at(0)
}
