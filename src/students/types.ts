export type StudentRecordFirebase = {
	id: string
	name: string
	tags: string[]
}
export type StudentRecord = {
	id: number
	name: string
	email?: string
	tags: string[]
	organization: number
	// Used by the attendances for the backwards compatibility (students were migrated from firebase)
	outerId: string

	updatedBy: number
	createdAt: string
	updatedAt: string
}

export type StudentCreate = Pick<
	StudentRecord,
	'tags' | 'name' | 'outerId' | 'email'
> & {
	unit?: string
}
export type StudentUpdate = Pick<StudentRecord, 'tags' | 'name'>
