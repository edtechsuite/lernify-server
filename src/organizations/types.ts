export type OrganizationRecordFirebase = {
	id: string
	name: string
	creator: string
}
export type OrganizationRecord = {
	id: string
	key: string
	name: string
	owner: number
	updatedBy: number
	createdAt: string
	updatedAt: string
}

export type OrganizationCreate = Pick<OrganizationRecord, 'key' | 'name'>
