import { FastifyInstance } from 'fastify'
import { PoolClient } from 'pg'
import { getOrganizations } from '../../firebase/organizations'
import { getOrgUsers, OrgUserRecordFirebase } from '../../firebase/users'
import { OrganizationRecordFirebase } from '../types'

export async function migrateOrganizations(app: FastifyInstance) {
	const organizations = await getOrganizations()
	const client = await app.pg.connect()
	try {
		// Organizations
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
		const query = `INSERT INTO organizations ( key, name, owner, "updatedBy" ) VALUES ${valuesTpl} ON CONFLICT DO NOTHING`
		const result = await client.query(query, values)

		// Users to Organizations
		await insertUsers2Org(client, organizations)

		return result
	} catch (error) {
		throw error
	} finally {
		client.release()
	}
}

async function insertUsers2Org(
	client: PoolClient,
	organizations: OrganizationRecordFirebase[]
) {
	const users = await Promise.all(
		organizations.map(async (org) => {
			return await getOrgUsers(org.id)
		})
	)
	const orgToUsers = organizations.reduce<
		Record<string, OrgUserRecordFirebase[]>
	>((acc, org, i) => {
		acc[org.id] = users[i]
		return acc
	}, {})
	const usersValues = organizations.flatMap((org) => {
		const users = orgToUsers[org.id]
		return users.map((user) => [
			user.id,
			org.id,
			user.role || 'Teacher',
			org.creator,
			new Date(),
			new Date(),
		])
	})
	const valuesTpl = usersValues
		.map(
			(org, i) =>
				`(
					(SELECT id FROM users WHERE "outerId"=$${i * 6 + 1}),
					(SELECT id FROM organizations WHERE "key"=$${i * 6 + 2}),
					$${i * 6 + 3},
					(SELECT id FROM users WHERE "outerId"=$${i * 6 + 4}),
					$${i * 6 + 5},
					$${i * 6 + 6}
				)`
		)
		.join(',')
	const values = usersValues.flat()

	const query = `INSERT INTO "usersToOrganizations" ( "userId", "organizationId", "role", "updatedBy", "createdAt", "updatedAt" ) VALUES ${valuesTpl}`
	return await client.query(query, values)
}
