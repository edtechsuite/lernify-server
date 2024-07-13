import { prisma } from '../../utils/prisma'

type Args = {
	participantId?: number
	activityId?: number
	orgId?: number
	userId: number
	leaveReasonComment: string
}
export async function removeParticipant({
	orgId,
	activityId,
	participantId,
	userId,
	leaveReasonComment,
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

	return await prisma.studentsToActivities.updateMany({
		where: {
			participantId: participant.id,
			activityId: activity.id,
			endDate: null,
		},
		data: {
			endDate: new Date(),
			updatedBy: userId,
			updatedAt: new Date(),
			leaveReasonComment: leaveReasonComment,
		},
	})
}
