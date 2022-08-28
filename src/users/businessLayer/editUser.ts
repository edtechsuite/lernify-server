import { Pool } from 'pg'
import { updateUserQuery } from '../../dal/users'

export async function updateUser(
	client: Pool,
	object: { id: number; name: string }
) {
	return await updateUserQuery(client, object)
}
