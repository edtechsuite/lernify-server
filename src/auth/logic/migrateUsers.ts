import { FastifyInstance } from 'fastify'
import { getUsers } from '../../firebase/users'

export async function migrateUsers(app: FastifyInstance) {
	const users = await getUsers()
	console.log('=-= users', users)
	const client = await app.pg.connect()
	try {
		const valuesTpl = users
			.map(
				(org, i) =>
					`( $${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4} )`
			)
			.join(',')
		const values = users
			.map((u) => [u.name || '', u.email || '', u.id, new Date()])
			.flat()
		const result = await client.query(
			`INSERT INTO users ( name, email, "outerId", "createdAt" ) VALUES ${valuesTpl} ON CONFLICT DO NOTHING`,
			values
		)
		console.log('=-= values', values)

		return result
	} catch (error) {
		throw error
	} finally {
		client.release()
	}
}
