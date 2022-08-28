import { PoolClient, Pool } from 'pg'
import { inviteTokenExpiration } from '../../config'
import { getOrganizationByIdQuery } from '../../dal/organizations'
import { User } from '../types'
import { addUserToOrganization } from './addUserToOrganization'

export async function inviteUser(
	client: PoolClient,
	outerUserId: string,
	email: string,
	orgId: number,
	role: string
) {
	const result = await createInviteQuery(client, {
		creator: outerUserId,
		dueTo: new Date(Date.now() + inviteTokenExpiration),
		email,
		orgId,
		token:
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15),
		role,
	})

	return result.rows[0]
}

async function createInviteQuery(
	client: PoolClient,
	data: {
		email: string
		token: string
		orgId: number
		dueTo: Date
		creator: string
		role: string
	}
) {
	return client.query(
		`INSERT INTO invites (
			"email", "token", "organization", "dueTo", "updatedBy", "role"
		) VALUES (
			$1, $2, $3, $4, (SELECT id FROM users WHERE "outerId"=$5), $6
		) ON CONFLICT ("email") DO UPDATE SET
			"token" = $2, "dueTo" = $4, "updatedBy" = (SELECT id FROM users WHERE "outerId"=$5), "updatedAt" = current_timestamp, "role" = $6
		RETURNING *`,
		[data.email, data.token, data.orgId, data.dueTo, data.creator, data.role]
	)
}

export async function confirmInvitation(
	client: Pool,
	token: string,
	email: string,
	user: User
): Promise<[number, string]> {
	const inviteResponse = await getInviteQuery(client, token)
	if (inviteResponse.rows.length === 0) {
		return [400, 'Invalid token']
	}

	const invite = inviteResponse.rows[0]

	if (invite.email !== email) {
		return [400, 'Invalid token']
	}

	if (new Date(invite.dueTo) < new Date()) {
		return [400, 'Token expired']
	}

	const organization = (
		await getOrganizationByIdQuery(client, invite.organization)
	).rows[0]

	await addUserToOrganization(
		client,
		organization.id,
		organization.key,
		user.outerId,
		user.id,
		invite.role
	)

	return [200, 'Invitation confirmed']
}

async function getInviteQuery(client: Pool, token: string) {
	return client.query<Invite>(`SELECT * FROM invites WHERE token = $1`, [token])
}
type Invite = {
	email: string
	token: string
	organization: number
	dueTo: string
	role: string
}
