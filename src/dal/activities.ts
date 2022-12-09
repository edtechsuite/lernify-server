import { Pool } from 'pg'
import { ActivityRecord } from '../activities/types'

export async function createActivityQuery(
	pool: Pool,
	data: Omit<ActivityRecord, 'id' | 'createdAt' | 'updatedAt'>
) {
	return pool.query(
		`INSERT INTO "activities" (
			"name", "performer", "organization", "updatedBy", "outerId"
		) VALUES (
			$1, $2, $3, $4, $5
		) ON CONFLICT DO NOTHING RETURNING *`,
		[data.name, data.performer, data.organization, data.updatedBy, data.outerId]
	)
}

export async function createActivityIfDoesNotExistQuery(
	pool: Pool,
	data: Omit<ActivityRecord, 'id' | 'createdAt' | 'updatedAt'>
) {
	const result = await pool.query(
		`SELECT * FROM "activities" WHERE "name" = $1`,
		[data.name]
	)

	if (result.rowCount > 0) {
		return null
	}
	return pool.query(
		`
			INSERT INTO "activities" (
				"name", "type", "performer", "organization", "updatedBy", "outerId"
			) VALUES (
				$1, $2, $3, $4, $5, $6
			) ON CONFLICT DO NOTHING RETURNING *
		`,
		[
			data.name,
			data.type,
			data.performer,
			data.organization,
			data.updatedBy,
			data.outerId,
		]
	)
}
