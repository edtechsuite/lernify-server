import { Pool } from 'pg'
import { User } from '../users/types'

export async function updateUserQuery(client: Pool, user: Partial<UserToSave>) {
	return await client.query<User>(
		`UPDATE users SET "name" = $1 WHERE "id" = $2 RETURNING *`,
		[user.name, user.id]
	)
}

export async function getUserByOuterIdQuery(client: Pool, outerId: string) {
	return await client.query<User>(
		`SELECT "role", "users"."name", "users"."id", "users"."createdAt", "users"."email", "users"."outerId" FROM "usersToOrganizations"
		INNER JOIN "users" ON "users"."id" = "usersToOrganizations"."userId"
		WHERE "outerId" = $1`,
		[outerId]
	)
}

type UserToSave = Omit<User, 'email' | 'outerId' | 'createdAt' | 'systemRole'>
