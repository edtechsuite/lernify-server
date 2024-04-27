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

	const [data, total] = await prisma.$transaction([
		prisma.students.findMany({
			where: { deleted: false, organization },
			skip: page * pageSize,
			take: pageSize,
		}),
		prisma.students.count({
			where: { deleted: false, organization },
		}),
	])
	return [data, total] as const
}
