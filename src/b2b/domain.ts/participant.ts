import { calculateRate } from '../../attendance/domain/attendanceRate'
import { getAttendancesByGroup } from '../../firebase/attendances'
import { AttendanceRecordFirebase } from '../../firebase/types'
import { OrganizationRecord } from '../../organizations/types'
import { isNotNull, isNotUndefined } from '../../utils/guards'
import { prisma } from '../../utils/prisma'

type GetParticipantsParams = {
	page: number
	pageSize: number
	organization: Pick<OrganizationRecord, 'id' | 'key'>
	// TODO
	// order: 'asc' | 'desc'
	// orderBy: 'rate' | 'participantName' | 'activityName'
}
export async function getParticipants(params: GetParticipantsParams) {
	const { organization, page, pageSize } = params
	const [data, total] = await findParticipantsWithCount(
		page,
		pageSize,
		organization.id
	)
	const attendanceRecordsByActivity = await fetchAttendanceRecords(
		data,
		organization.key
	)
	const simplifiedData = data.map(({ studentsToActivities, ...student }) => {
		const activities = studentsToActivities
			.map((s) => s.activity)
			.filter(isNotNull)

		return {
			...student,
			activities: parseActivities(
				activities,
				student,
				attendanceRecordsByActivity
			),
		}
	})

	return [simplifiedData, total] as const
}

function parseActivities(
	activities: ActivityShort[],
	student: ParticipantShort,
	attendanceRecordsByActivity: Map<number, AttendanceRecordFirebase[]>
) {
	return activities.map((activity) => {
		const attendanceRecords = attendanceRecordsByActivity.get(activity.id) ?? []
		const rates = calculateRate(attendanceRecords)
		const rateValues = rates.get(activity.outerId)?.get(student.outerId)
		return {
			id: activity.id,
			name: activity.name,
			performer: activity.performer,
			rate: rateValues?.rate ?? 0,
			attended: rateValues?.attended ?? 0,
			total: rateValues?.total ?? 0,
		}
	})
}

function findParticipantsWithCount(
	page: number,
	pageSize: number,
	organizationId: number
) {
	const where = { deleted: false, organization: organizationId }
	return prisma.$transaction([
		prisma.students.findMany({
			where,
			skip: page * pageSize,
			take: pageSize,
			select: {
				id: true,
				name: true,
				tags: true,
				outerId: true,
				studentsToActivities: {
					where: {
						endDate: null,
					},
					include: {
						activity: {
							select: {
								id: true,
								name: true,
								createdAt: true,
								outerId: true,
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
}

async function fetchAttendanceRecords(
	attendees: ParticipantWithS2A[],
	organizationKey: string
) {
	const attendanceRecordsCache = new Map<number, AttendanceRecordFirebase[]>()
	const attendancesRecordsWithActivityIds = await fetchAllAttendances(
		attendees,
		organizationKey
	)

	attendancesRecordsWithActivityIds.forEach(({ activity, attendances }) => {
		attendanceRecordsCache.set(activity.id, attendances)
	})

	return attendanceRecordsCache
}

function getUniqueActivities(participants: ParticipantWithS2A[]) {
	const activities = participants
		.map((p) => p.studentsToActivities.map((s2a) => s2a.activity))
		.flat()
		.filter(isNotNull)
	const ids = participants
		.map((p) => p.studentsToActivities.map((s2a) => s2a.activity?.outerId))
		.flat()
		.filter(isNotUndefined)
	const uniqueIds = Array.from(new Set(ids))

	return activities.filter((a) => uniqueIds.includes(a.outerId))
}

async function fetchAllAttendances(
	attendees: ParticipantWithS2A[],
	organizationKey: string
) {
	const uniqueActivities = getUniqueActivities(attendees)
	return await Promise.all(
		uniqueActivities.map(async (activity) => {
			return {
				activity,
				attendances: await getAttendancesByGroup(
					organizationKey,
					{
						from: activity.createdAt,
						to: new Date(),
					},
					activity.outerId
				),
			}
		})
	)
}

type ParticipantWithS2A = ParticipantShort & {
	studentsToActivities: {
		activity: { id: number; createdAt: Date; outerId: string } | null
	}[]
	outerId: string
}
type ParticipantShort = {
	id: number
	name: string
	tags: string[]
	outerId: string
}

type ActivityShort = {
	id: number
	name: string
	outerId: string
	performer: {
		id: number
		name: string
		email: string
	} | null
}
