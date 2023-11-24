import { prisma } from '../../utils/prisma'

type Args = {
	participantId?: number
	activityId?: number
	from?: string
	to?: string
}
export async function getStudentParticipation({
	participantId,
	activityId,
	from,
	to,
}: Args) {
	const result = await prisma.studentsToActivities.findMany({
		where: {
			participantId: participantId,
			activityId: activityId,
			...getEndDateCondition(from),
			...getStartDateCondition(to),
		},
		select: {
			id: true,
			activity: {
				select: returnActivity,
			},
			startDate: true,
			endDate: true,
			participantId: true,
			leaveReasonComment: true,
		},
	})

	return result
}

function getEndDateCondition(date?: string) {
	if (!date) {
		return {}
	}

	return {
		OR: [
			{
				endDate: {
					gte: new Date(date),
				},
			},
			{
				endDate: null,
			},
		],
	}
}

function getStartDateCondition(date?: string) {
	if (!date) {
		return {}
	}

	return {
		OR: [
			{
				startDate: {
					lte: new Date(date),
				},
			},
		],
	}
}

const returnActivity = {
	id: true,
	name: true,
	performerId: true,
	type: true,
	outerId: true,
	deleted: true,
	updatedBy: true,
	createdAt: true,
	updatedAt: true,
	archived: true,
}
