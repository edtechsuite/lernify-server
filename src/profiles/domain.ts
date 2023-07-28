import { ForbiddenError } from '../utils/errors'
import { prisma } from '../utils/prisma'
import { User } from '../users/types'
import { Profile, ProfileWithUser, profileSelector } from './model'

export async function updateProfile(
	subject: ProfileWithUser | null,
	id: number,
	profile: Partial<Profile>
) {
	const updatingItself = subject?.id === id
	const isSysAdmin = subject?.user.systemRole === 'system-administrator'
	const isAdmin = subject?.role.toLowerCase() === 'administrator'
	const hasPermissions = updatingItself || isSysAdmin || isAdmin
	if (!hasPermissions) {
		throw new ForbiddenError()
	}

	return prisma.usersToOrganizations.update({
		where: {
			id,
		},
		data: {
			name: profile.name,
		},
		select: profileSelector,
	})
}

export async function getProfiles(orgId: number, deleted = false) {
	return prisma.usersToOrganizations.findMany({
		where: {
			organizationId: orgId,
			deleted,
		},
		include: {
			user: {
				select: {
					id: true,
					email: true,
					outerId: true,
				},
			},
		},
	})
}

export async function getProfile(id: number) {
	// TODO: check permissions
	// User has access to organization of profile
	return prisma.usersToOrganizations.findUniqueOrThrow({
		where: {
			id,
		},
		include: {
			user: {
				select: {
					id: true,
					email: true,
					outerId: true,
				},
			},
		},
	})
}

export async function getProfileByUserAndOrg(userId: number, orgId: number) {
	return prisma.usersToOrganizations.findFirstOrThrow({
		where: {
			userId,
			organizationId: orgId,
		},
		include: {
			user: true,
		},
	})
}
