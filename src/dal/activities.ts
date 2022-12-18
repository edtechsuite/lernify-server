import { Pool } from 'pg'
import { ActivityRecord } from '../activities/types'

export async function createActivityQuery(
	pool: Pool,
	data: Omit<ActivityRecord, 'id' | 'createdAt' | 'updatedAt'>
) {
	return pool.query(
		`INSERT INTO "activities" (
			"name", "performerId", "organizationId", "updatedBy", "outerId"
		) VALUES (
			$1, $2, $3, $4, $5
		) ON CONFLICT DO NOTHING RETURNING *`,
		[
			data.name,
			data.performerId,
			data.organizationId,
			data.updatedBy,
			data.outerId,
		]
	)
}

export async function createActivityIfDoesNotExistQuery(
	pool: Pool,
	data: Omit<ActivityRecord, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>
) {
	const result = await pool.query(
		`SELECT * FROM "activities" WHERE "outerId" = $1`,
		[data.outerId]
	)

	if (result.rowCount > 0) {
		return null
	}
	return pool.query(
		`
			INSERT INTO "activities" (
				"name", "type", "performerId", "organizationId", "updatedBy", "outerId"
			) VALUES (
				$1, $2, $3, $4, $5, $6
			) ON CONFLICT DO NOTHING RETURNING *
		`,
		[
			data.name,
			data.type,
			data.performerId,
			data.organizationId,
			data.updatedBy,
			data.outerId,
		]
	)
}

export async function assignParticipantToActivityIfDoesNotExistQuery(
	pool: Pool,
	data: {
		activityId: number
		participantId: number
		startDate: Date
		endDate: Date | null
		updatedBy: number
	}
) {
	const result = await pool.query(
		`SELECT * FROM "studentsToActivities" WHERE "activityId" = $1 AND "participantId" = $2 AND "startDate" = $3 AND "endDate" = $4`,
		[data.activityId, data.participantId, data.startDate, data.endDate]
	)

	if (result.rowCount > 0) {
		return null
	}
	return pool.query(
		`
			INSERT INTO "studentsToActivities" (
				"activityId", "participantId", "startDate", "endDate", "updatedBy"
			) VALUES (
				$1, $2, $3, $4, $5
			) ON CONFLICT DO NOTHING RETURNING *
		`,
		[
			data.activityId,
			data.participantId,
			data.startDate,
			data.endDate,
			data.updatedBy,
		]
	)
}

export async function getActivitiesByOrg(pool: Pool, orgId: number) {
	return await pool.query<ActivityRecord>(
		`SELECT * FROM "activities" WHERE "organizationId" = $1`,
		[orgId]
	)
}

export async function getActivitiesByParams(
	pool: Pool,
	params: Partial<ActivityRecord>
) {
	const keys = Object.keys(params)
	const values = Object.values(params)

	if (keys.length === 0) {
		return await pool.query<ActivityRecord>(`SELECT * FROM "activities"`)
	}

	const keysStr = keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ')
	const whereStr = keysStr ? `WHERE ${keysStr}` : ''

	return await pool.query<ActivityRecord>(
		`SELECT * FROM "activities" ${whereStr}`,
		[values]
	)
}
