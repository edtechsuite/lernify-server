import { FastifyInstance } from 'fastify'
import { getOrganizations } from '../../firebase/organizations'

export async function migrateOrganizations(app: FastifyInstance) {
	const organizations = await getOrganizations()
	const client = await app.pg.connect()
	try {
		const valuesTpl = organizations
			.map(
				(org, i) =>
					`(
						$${i * 4 + 1},
						$${i * 4 + 2},
						(SELECT id FROM users WHERE "outerId"=$${i * 4 + 3}),
					 	(SELECT id FROM users WHERE "outerId"=$${i * 4 + 4})
					)`
			)
			.join(',')
		const values = organizations
			.map((org) => [org.id, org.name, org.creator, org.creator])
			.flat()
		const query = `INSERT INTO organizations ( key, name, owner, "updatedBy" ) VALUES ${valuesTpl}`
		const result = await client.query(query, values)

		return result
	} catch (error) {
		throw error
	} finally {
		client.release()
	}
}
