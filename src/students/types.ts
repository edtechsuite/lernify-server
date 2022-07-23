export type StudentRecordFirebase = {
	id: string
	name: string
	tags: string[]
}
export type StudentRecord = {
	id: number
	name: string
	tags: string[]
	organization: number

	updatedBy: number
	createdAt: string
	updatedAt: string
}

export type StudentCreate = Pick<
	StudentRecord,
	'tags' | 'name' | 'organization'
>
