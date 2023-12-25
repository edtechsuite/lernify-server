import { prisma } from '../../utils/prisma'

type Args = {
	participantId?: number
	activityId?: number
	orgId?: number
	userId: number
}
export async function addParticipant({
	participantId,
	activityId,
	orgId,
	userId,
}: Args) {
	const activity = await prisma.activities.findFirstOrThrow({
		where: {
			organizationId: orgId,
			id: activityId,
		},
	})
	const participant = await prisma.students.findFirstOrThrow({
		where: {
			organization: orgId,
			id: participantId,
		},
	})

	const existingRecord = await prisma.studentsToActivities.findFirst({
		where: {
			participantId: participant.id,
			activityId: activity.id,
			endDate: null,
		},
	})

	if (existingRecord) {
		throw new Error('Participant is already assigned to the activity.')
	}

	return await prisma.studentsToActivities.create({
		data: {
			participantId: participant.id,
			activityId: activity.id,
			startDate: new Date(),
			endDate: null,
			updatedBy: userId,
		},
	})
}
