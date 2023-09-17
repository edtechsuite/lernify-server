export type AttendanceRecordFirebase = {
	attended: Record<string, boolean | undefined>
	date: number
	group: string
	teacher: string
}
