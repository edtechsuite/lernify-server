import { PoolClient } from 'pg'
import { OrganizationRecord } from '../organizations/types'
import { StudentRecord } from '../students/types'

export async function getStudentByIdQuery(client: PoolClient, id: number) {
	// TODO
	throw new Error('Not implemented')
	// return await client.query<OrganizationRecord>(
	// 	`SELECT * FROM "organizations"
	// 	WHERE "id" = $1`,
	// 	[id]
	// )
}

export async function getStudentsByOrg(client: PoolClient, id: number) {
	return await client.query<StudentRecord>(
		`SELECT * FROM "students" WHERE "organization" = $1`,
		[id]
	)
}

export async function createStudentQuery(
	client: PoolClient,
	data: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>
) {
	return client.query(
		`INSERT INTO "students" (
			"name", "tags", "organization", "updatedBy"
		) VALUES (
			$1, $2, $3, $4
		) RETURNING *`,
		[data.name, data.tags, data.organization, data.updatedBy]
	)
}

export async function removeAllStudentsQuery(client: PoolClient) {
	return client.query(`DELETE FROM "students"`)
}
