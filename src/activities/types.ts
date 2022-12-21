export type GroupRecordFirebase = {
	id: string
	name: string
	teacher: string
}
export type StudentsToGroupRecordFirebase = {
	id: string
	startDate: number
	endDate: number | null
	groupId: string
	studentId: string
}
export type ActivityRecord = {
	type: 'group'
	id: number
	name: string
	performerId: number | null
	organizationId: number
	// Used by the attendances for the backwards compatibility (groups were migrated from firebase)
	outerId: string
	deleted: boolean

	updatedBy: number
	createdAt: string
	updatedAt: string
}

export type ActivityUpdate = Pick<ActivityRecord, 'performerId' | 'name'>
export type ActivityCreate = Pick<
	ActivityRecord,
	'performerId' | 'name' | 'type'
>
