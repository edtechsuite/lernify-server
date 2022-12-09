import { Pool } from 'pg'
import { getAllOrganization } from '../../dal/organizations'
import { createActivityIfDoesNotExistQuery } from '../../dal/activities'
import { getUserByOuterIdQuery } from '../../dal/users'
import { getGroups } from '../../firebase/groups'
import { User } from '../../users/types'

export async function migrateGroups(pool: Pool, user: User) {
	let count = 0
	const organizations = await getAllOrganization(pool)

	console.log('migrateGroups 1')
	for await (const org of organizations.rows) {
		const list = await getGroups(org.key)
		for await (const group of list) {
			const usersResult = await getUserByOuterIdQuery(pool, group.teacher)
			const performer = usersResult.rows.at(0)
			const result = await createActivityIfDoesNotExistQuery(pool, {
				...group,
				type: 'group',
				performer: performer?.id || null,
				name: group.name.trim(),
				outerId: group.id,
				organization: org.id,
				updatedBy: user.id,
			})
			count += result ? result.rowCount : 0
		}
	}

	return count
}
