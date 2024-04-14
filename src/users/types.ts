export type User = {
	id: number
	name: string
	email: string
	outerId: string
	createdAt: string
	systemRole: string | null
}

// TODO: probably need to use this type instead of User everywhere
export type UserPrisma = {
	id: number
	name: string
	email: string
	outerId: string
	createdAt: Date
	systemRole: string | null
}
