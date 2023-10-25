import { Pool } from 'pg'
import { inviteTokenExpiration } from '../../config'
import { getOrganizationByIdQuery } from '../../dal/organizations'
import { User } from '../types'
import { addUserToOrganization } from './addUserToOrganization'
import { prisma } from '../../utils/prisma'

export async function inviteUser(
	outerUserId: string,
	email: string,
	orgId: number,
	role: string
) {
	const inviteDate = {
		email,
		organizations: {
			connect: {
				id: orgId,
			},
		},
		role,
		token:
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15),
		dueTo: new Date(Date.now() + inviteTokenExpiration),
		updatedByUsers: {
			connect: {
				outerId: outerUserId,
			},
		},
	}

	// TODO: `email` is unique, so we can't create multiple invites for the same email for different organizations
	const invite = prisma.invites.upsert({
		where: {
			email,
		},
		create: inviteDate,
		update: inviteDate,
		include: {
			updatedByUsers: true,
			organizations: true,
		},
	})

	return invite
}

export async function confirmInvitation(
	client: Pool,
	token: string,
	email: string,
	user: User,
	name: string
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

	const alreadyInvited = await prisma.usersToOrganizations.findFirst({
		where: {
			organizationId: invite.organization,
			userId: user.id,
		},
	})

	if (alreadyInvited) {
		await prisma.usersToOrganizations.update({
			where: {
				id: alreadyInvited.id,
			},
			data: {
				role: invite.role,
				updatedBy: user.id,
				updatedAt: new Date(),
				name,
			},
		})
		return [200, 'Invitation confirmed']
	}

	await addUserToOrganization(
		organization.id,
		organization.key,
		user.outerId,
		user.id,
		invite.role,
		name
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
