import { PoolClient } from 'pg'
import { getAllOrganization } from '../../dal/organizations'
import { createStudentQuery } from '../../dal/students'
import { getStudents } from '../../firebase/students'
import { User } from '../../users/types'

export async function migrateStudents(client: PoolClient, user: User) {
	let count = 0
	const organizations = await getAllOrganization(client)

	for await (const org of organizations.rows) {
		const students = await getStudents(org.key)
		for await (const student of students) {
			const result = await createStudentQuery(client, {
				...student,
				organization: org.id,
				updatedBy: user.id,
			})
			count += result.rowCount
		}
	}

	return count
}
