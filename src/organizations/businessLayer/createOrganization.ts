import { FastifyInstance } from 'fastify'
import { OrganizationCreate } from '../types'
import { createOrganization as createOrganizationInFirebase } from '../../firebase/organizations'
import { User } from '../../users/types'
import { prisma } from '../../utils/prisma'

export async function createOrganization(
	userId: string,
	org: OrganizationCreate,
	user: User
) {
	const result = await addOrganization(org, user)
	await createOrganizationInFirebase(
		{
			id: org.key,
			name: org.name,
			creator: userId,
		},
		{
			id: userId,
		}
	)

	return result
}

async function addOrganization(org: OrganizationCreate, user: User) {
	return prisma.organizations.create({
		data: {
			key: org.key,
			name: org.name,
			owner: user.id,
			updatedBy: user.id,
			users: {
				create: {
					role: 'Administrator',
					userId: user.id,
					name: user.name || user.email,
					updatedBy: user.id,
				},
			},
		},
	})
}
