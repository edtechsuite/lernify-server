import { prisma } from '../../utils/prisma'

export async function unassignParticipantFromActivity(
	organizationId: number,
	activityId: number,
	participantId: number
) {
	await prisma.studentsToActivities.updateMany({
		where: {
			participantId: participantId,
			activityId: activityId,
			endDate: null,
			activity: {
				organizationId: organizationId,
			},
			participant: {
				organization: organizationId,
			},
		},
		data: {
			endDate: new Date(),
		},
	})
}

export async function unassignParticipantFromAllActivities(
	organizationId: number,
	participantId: number
) {
	await prisma.studentsToActivities.updateMany({
		where: {
			participantId: participantId,
			endDate: null,
			activity: {
				organizationId: organizationId,
			},
			participant: {
				organization: organizationId,
			},
		},
		data: {
			endDate: new Date(),
		},
	})
}
