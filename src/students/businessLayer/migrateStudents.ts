import { Pool } from 'pg'
import { getAllOrganization } from '../../dal/organizations'
import { createStudentQuery } from '../../dal/students'
import { getStudents } from '../../firebase/students'
import { User } from '../../users/types'

export async function migrateStudents(pool: Pool, user: User) {
	let count = 0
	const organizations = await getAllOrganization(pool)

	for await (const org of organizations.rows) {
		const students = await getStudents(org.key)
		for await (const student of students) {
			const result = await createStudentQuery(pool, {
				...student,
				tags: student.tags || [],
				name: student.name.trim(),
				outerId: student.id,
				organization: org.id,
				updatedBy: user.id,
			})
			count += result.rowCount
		}
	}

	return count
}
