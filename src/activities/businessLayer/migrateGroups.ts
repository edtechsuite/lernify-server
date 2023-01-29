import { Pool } from 'pg'
import { getAllOrganization } from '../../dal/organizations'
import {
	assignParticipantToActivityIfDoesNotExistQuery,
	createActivityIfDoesNotExistQuery,
} from '../../dal/activities'
import { getUserByOuterIdQuery } from '../../dal/users'
import { getGroups } from '../../firebase/groups'
import { getStudentsToGroups } from '../../firebase/studentsToGroups'
import { User } from '../../users/types'

// TODO: do we need it?
export async function migrateGroups(pool: Pool, user: User) {
	const organizations = await getAllOrganization(pool)

	// Groups
	let groupsCount = 0
	for await (const org of organizations.rows) {
		const list = await getGroups(org.key)
		for await (const group of list) {
			const usersResult = await getUserByOuterIdQuery(pool, group.teacher)
			const performer = usersResult.rows.at(0)
			const result = await createActivityIfDoesNotExistQuery(pool, {
				...group,
				type: 'group',
				performerId: performer?.id || null,
				name: group.name.trim(),
				outerId: group.id,
				organizationId: org.id,
				updatedBy: user.id,
				archived: false,
			})
			groupsCount += result ? result.rowCount : 0
		}
	}

	// Student to groups
	const activities = await pool.query(`SELECT * FROM "activities"`, [])
	const activitiesByOuterId = new Map(
		activities.rows.map((a: any) => [a.outerId, a])
	)
	const students = await pool.query(`SELECT * FROM "students"`, [])
	const studentsByOuterId = new Map(
		students.rows.map((a: any) => [a.outerId, a])
	)

	let studentsToGroupsCount = 0
	for await (const org of organizations.rows) {
		const list = await getStudentsToGroups(org.key)
		for await (const record of list) {
			const result = await assignParticipantToActivityIfDoesNotExistQuery(
				pool,
				{
					activityId: activitiesByOuterId.get(record.groupId).id,
					participantId: studentsByOuterId.get(record.studentId).id,
					startDate: new Date(record.startDate),
					endDate: record.endDate ? new Date(record.endDate) : null,
					updatedBy: user.id,
				}
			)
			studentsToGroupsCount += result ? result.rowCount : 0
		}
	}

	return {
		groupsCount,
		studentsToGroupsCount,
	}
}
