export type AttendanceRecordFirebase = {
	id: string
	attended: Record<string, boolean | undefined>
	date: number
	group: string
	teacher: string
}
