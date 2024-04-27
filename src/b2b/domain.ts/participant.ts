import { isNotNull } from '../../utils/guards'
import { prisma } from '../../utils/prisma'

type GetParticipantsParams = {
	page: number
	pageSize: number
	organization: number
	// TODO
	// order: 'asc' | 'desc'
	// orderBy: 'rate' | 'participantName' | 'activityName'
}
export async function getParticipants(params: GetParticipantsParams) {
	const { organization, page, pageSize } = params

	const where = { deleted: false, organization }
	const [data, total] = await prisma.$transaction([
		prisma.students.findMany({
			where,
			skip: page * pageSize,
			take: pageSize,
			select: {
				id: true,
				name: true,
				tags: true,
				studentsToActivities: {
					where: {
						endDate: null,
					},
					include: {
						activity: {
							select: {
								id: true,
								name: true,
								performer: {
									select: {
										id: true,
										name: true,
										email: true,
									},
								},
							},
						},
					},
				},
			},
		}),
		prisma.students.count({
			where,
		}),
	])

	return [
		data.map(({ studentsToActivities, ...student }) => {
			const activities = studentsToActivities
				.map((s) => s.activity)
				.filter(isNotNull)

			return {
				...student,
				activities,
			}
		}),
		total,
	] as const
}
