export type Profile = {
	id: number
	name: string
	userId: number
	organizationId: number
	role: string
	deleted: boolean
	createdAt: Date
	updatedAt: Date
	updatedBy: number
}

export const profileSelector: Record<keyof Profile, boolean> = {
	id: true,
	name: true,
	userId: true,
	organizationId: true,
	role: true,
	deleted: true,
	createdAt: true,
	updatedAt: true,
	updatedBy: true,
}
