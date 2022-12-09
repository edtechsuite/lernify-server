export type GroupRecordFirebase = {
	id: string
	name: string
	teacher: string
}
export type ActivityRecord = {
	type: 'group'
	id: number
	name: string
	performer: number | null
	organization: number
	// Used by the attendances for the backwards compatibility (groups were migrated from firebase)
	outerId: string

	updatedBy: number
	createdAt: string
	updatedAt: string
}
