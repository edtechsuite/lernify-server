import { PoolClient } from 'pg'
import { User } from '../users/types'

export async function getUserByOuterId(client: PoolClient, outerId: string) {
	const result = await client.query<User>(
		`SELECT * FROM users WHERE "outerId"=$1`,
		[outerId]
	)
	if (result.rows.length === 0) {
		throw new Error('User not found')
	}

	return result.rows[0]
}
