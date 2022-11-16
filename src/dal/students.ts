import { Pool } from 'pg'
import { StudentRecord } from '../students/types'

export async function getStudentByIdQuery(pool: Pool, id: number) {
	return await pool.query<StudentRecord>(
		`SELECT * FROM "students"
		WHERE "id" = $1`,
		[id]
	)
}

export async function getStudentsByOrg(pool: Pool, id: number) {
	return await pool.query<StudentRecord>(
		`SELECT * FROM "students" WHERE "organization" = $1`,
		[id]
	)
}

export async function createStudentQuery(
	pool: Pool,
	data: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>
) {
	return pool.query(
		`INSERT INTO "students" (
			"name", "tags", "organization", "updatedBy", "outerId"
		) VALUES (
			$1, $2, $3, $4, $5
		) RETURNING *`,
		[data.name, data.tags, data.organization, data.updatedBy, data.outerId]
	)
}

export async function updateStudentQuery(
	pool: Pool,
	id: number,
	data: Omit<
		StudentRecord,
		'id' | 'createdAt' | 'updatedAt' | 'organization' | 'outerId'
	>
) {
	return pool.query(
		`UPDATE "students" SET
		"name" = $2, "tags" = $3, "updatedBy" = $4
		where "id" = $1 RETURNING *`,
		[id, data.name, data.tags, data.updatedBy]
	)
}

export async function removeStudentQuery(pool: Pool, id: number) {
	return pool.query(`DELETE FROM "students" WHERE "id" = $1 RETURNING *`, [id])
}
