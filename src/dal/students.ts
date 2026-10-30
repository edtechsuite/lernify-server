import { Pool } from 'pg'
import { StudentRecord } from '../students/types'
import { prisma } from '../utils/prisma'

export function escapeIlike(value: string): string {
	return value.replace(/[\\%_]/g, '\\$&')
}

export function toIlikePattern(filter?: string): string | null {
	const trimmed = filter?.trim()
	if (!trimmed) {
		return null
	}
	return `%${escapeIlike(trimmed)}%`
}

export async function findStudents(
	organizationId: number,
	filter?: string
): Promise<StudentRecord[]> {
	const pattern = toIlikePattern(filter)
	return prisma.$queryRaw<StudentRecord[]>`
	SELECT * FROM "students"
		WHERE "organization" = ${organizationId}
		  AND "deleted" = false
	AND(
		    ${pattern}:: text IS NULL
		    OR "name" ILIKE ${pattern} ESCAPE '\\'
		    OR "email" ILIKE ${pattern} ESCAPE '\\'
		    OR EXISTS(
			SELECT 1 FROM unnest("tags") AS t
		      WHERE t ILIKE ${pattern} ESCAPE '\\'
		)
	)
		`
}

export type FindStudentsByActivityParams = {
	activityId: number
	organizationId?: number
	startDate?: Date
	endDate?: Date
	filter?: string
}

export async function findStudentsByActivity(
	params: FindStudentsByActivityParams
): Promise<StudentRecord[]> {
	const {
		activityId,
		organizationId = null,
		startDate = null,
		endDate = null,
		filter,
	} = params
	const pattern = toIlikePattern(filter)
	return prisma.$queryRaw<StudentRecord[]>`
		SELECT s.*
		FROM "studentsToActivities" sta
		INNER JOIN "activities" a ON a."id" = sta."activityId"
		INNER JOIN "students" s ON s."id" = sta."participantId"
		WHERE sta."activityId" = ${activityId}
	AND(${organizationId}:: int IS NULL OR a."organizationId" = ${organizationId})
	AND(${startDate}:: timestamp IS NULL OR sta."startDate" <= ${startDate})
	AND(sta."endDate" IS NULL OR ${endDate}:: timestamp IS NULL OR sta."endDate" >= ${endDate})
	AND(
		${pattern}:: text IS NULL
		    OR(
			s."deleted" = false
		      AND(
				s."name" ILIKE ${pattern} ESCAPE '\\'
		        OR s."email" ILIKE ${pattern} ESCAPE '\\'
		        OR EXISTS(
					SELECT 1 FROM unnest(s."tags") AS t
		          WHERE t ILIKE ${pattern} ESCAPE '\\'
				)
			)
		)
	)
	`
}


export async function getStudentByIdQuery(pool: Pool, id: number) {
	return await pool.query<StudentRecord>(
		`SELECT * FROM "students"
		WHERE "id" = $1`,
		[id]
	)
}

export async function getStudentByNameAndOrganizationQuery(
	pool: Pool,
	name: string,
	organization: number
) {
	return await pool.query<StudentRecord>(
		`SELECT * FROM "students"
		WHERE "name" = $1 AND "organization" = $2`,
		[name, organization]
	)
}

export async function createStudentQuery(
	pool: Pool,
	data: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>
) {
	return pool.query(
		`INSERT INTO "students"(
		"name", "tags", "organization", "updatedBy", "outerId"
	) VALUES(
		$1, $2, $3, $4, $5
	) RETURNING * `,
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
		where "id" = $1 RETURNING * `,
		[id, data.name, data.tags, data.updatedBy]
	)
}

export async function removeStudentQuery(pool: Pool, id: number) {
	return pool.query(`DELETE FROM "students" WHERE "id" = $1 RETURNING * `, [id])
}
