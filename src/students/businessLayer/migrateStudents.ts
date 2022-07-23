import { PoolClient } from 'pg'
import { getAllOrganization } from '../../dal/organizations'
import { createStudentQuery } from '../../dal/students'
import { getStudents } from '../../firebase/students'
import { User } from '../../users/types'

export async function migrateStudents(client: PoolClient, user: User) {
	let count = 0
	const organizations = await getAllOrganization(client)
	await organizations.rows.forEach(async (org) => {
		const students = await getStudents(org.key)
		await students.forEach(async (student) => {
			const result = await createStudentQuery(client, {
				...student,
				organization: org.id,
				updatedBy: user.id,
			})
			count += result.rowCount
		})
	})

	return count
}
