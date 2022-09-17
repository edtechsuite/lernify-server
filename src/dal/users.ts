import { Pool } from 'pg'
import { User } from '../users/types'

export async function updateUserQuery(client: Pool, user: Partial<UserToSave>) {
	return await client.query<User>(
		`UPDATE users SET "name" = $1 WHERE "id" = $2 RETURNING *`,
		[user.name, user.id]
	)
}

type UserToSave = Omit<User, 'email' | 'outerId' | 'createdAt' | 'systemRole'>
