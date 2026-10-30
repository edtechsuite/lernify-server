import { calculateRate } from '../../attendance/domain/attendanceRate'
import { toIlikePattern } from '../../dal/students'
import { getAttendancesByGroup } from '../../firebase/attendances'
import { AttendanceRecordFirebase } from '../../firebase/types'
import { OrganizationRecord } from '../../organizations/types'
import { isNotNull, isNotUndefined } from '../../utils/guards'
import { prisma } from '../../utils/prisma'

type GetParticipantsParams = {
	page: number
	pageSize: number
	filter?: string
	organization: Pick<OrganizationRecord, 'id' | 'key'>
	// TODO
	// order: 'asc' | 'desc'
	// orderBy: 'rate' | 'participantName' | 'activityName'
}
export async function getParticipants(params: GetParticipantsParams) {
	const { organization, page, pageSize, filter } = params
	const [data, total] = await findParticipantsWithCount(
		page,
		pageSize,
		organization.id,
		filter
	)
	const attendanceRecordsByActivity = await fetchAttendanceRecords(
		data,
		organization.key
	)
	const simplifiedData = data.map(({ studentsToActivities, ...student }) => {
		const activities = studentsToActivities
			.map((s) => s.activity)
			.filter(isNotNull)

		const { outerId, ...studentsRest } = student
		return {
			...studentsRest,
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

async function findParticipantsWithCount(
	page: number,
	pageSize: number,
	organizationId: number,
	filter?: string
): Promise<[ParticipantWithS2A[], number]> {
	const pattern = toIlikePattern(filter)
	const offset = page * pageSize
	const rows = await prisma.$queryRaw<
		Array<{ total: number; data: RawParticipantWithS2A[] }>
	>`
		WITH filtered_students AS (
			SELECT "id", "name", "tags", "outerId"
			FROM "students"
			WHERE "deleted" = false
			  AND "organization" = ${organizationId}
			  AND (
			    ${pattern}::text IS NULL
			    OR "name" ILIKE ${pattern} ESCAPE '\\'
			    OR "email" ILIKE ${pattern} ESCAPE '\\'
			    OR EXISTS (
			      SELECT 1 FROM unnest("tags") AS t
			      WHERE t ILIKE ${pattern} ESCAPE '\\'
			    )
			  )
		),
		counted AS (
			SELECT COUNT(*)::int AS "total" FROM filtered_students
		),
		paged AS (
			SELECT
				fs."id",
				fs."name",
				fs."tags",
				fs."outerId",
				COALESCE(
					(
						SELECT json_agg(
							json_build_object(
								'activity',
								CASE
									WHEN a."id" IS NULL THEN NULL
									ELSE json_build_object(
										'id', a."id",
										'name', a."name",
										'createdAt', a."createdAt",
										'outerId', a."outerId",
										'performer',
										CASE
											WHEN u."id" IS NULL THEN NULL
											ELSE json_build_object(
												'id', u."id",
												'name', u."name",
												'email', u."email"
											)
										END
									)
								END
							)
						)
						FROM "studentsToActivities" sta
						LEFT JOIN "activities" a ON a."id" = sta."activityId"
						LEFT JOIN "users" u ON u."id" = a."performerId"
						WHERE sta."participantId" = fs."id"
						  AND sta."endDate" IS NULL
					),
					'[]'::json
				) AS "studentsToActivities"
			FROM filtered_students fs
			OFFSET ${offset}
			LIMIT ${pageSize}
		)
		SELECT
			c."total",
			COALESCE(
				(SELECT json_agg(p.*) FROM paged p),
				'[]'::json
			) AS "data"
		FROM counted c
	`

	const row = rows[0] ?? { total: 0, data: [] }
	const data: ParticipantWithS2A[] = row.data.map((student) => ({
		...student,
		studentsToActivities: student.studentsToActivities.map((s2a) => ({
			activity: s2a.activity
				? {
						...s2a.activity,
						createdAt: new Date(s2a.activity.createdAt),
				  }
				: null,
		})),
	}))

	return [data, row.total]
}

type RawParticipantWithS2A = ParticipantShort & {
	studentsToActivities: {
		activity: (Omit<ActivityShort, 'performer'> & {
			createdAt: string | Date
			performer: ActivityShort['performer']
		}) | null
	}[]
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
		activity: (ActivityShort & { createdAt: Date }) | null
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
