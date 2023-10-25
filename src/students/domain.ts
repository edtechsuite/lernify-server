export function recalculateCurrentAttendanceRate(
	attendeeToActivity: AttendeeToActivity[],
	attendances: AttendanceRecord[]
) {
	const groupOuterIdToAttendance = attendances.reduce<
		Record<string, AttendanceRecord[]>
	>((acc, attendance) => {
		return {
			...acc,
			[attendance.group]: acc[attendance.group]
				? [...acc[attendance.group], attendance]
				: [attendance],
		}
	}, {})

	const newRecords = attendeeToActivity.map((a2a) => {
		const { activityOuterId, participantOuterId } = a2a

		let allRecords = 0
		let attendedRecords = 0
		groupOuterIdToAttendance[activityOuterId]?.forEach((attendance) => {
			if (
				!isAttendanceRecordInTheRange(a2a.startDate, a2a.endDate, attendance)
			) {
				return
			}
			const attended = attendance.attended[participantOuterId]
			if (typeof attended === 'undefined') {
				return
			}

			allRecords += 1
			attendedRecords += attended ? 1 : 0
		})

		return {
			...a2a,
			allRecords,
			attendanceRate: allRecords ? attendedRecords / allRecords : 0,
		}
	})

	return newRecords
}

type AttendeeToActivity = {
	id: number
	activityOuterId: string
	participantOuterId: string
	startDate: Date
	endDate: Date | null
}

type AttendanceRecord = {
	id: string
	date: number
	attended: Record<string, boolean | undefined>
	group: string
}

function isAttendanceRecordInTheRange(
	from: Date,
	to: Date | null,
	attendance: AttendanceRecord
) {
	return (
		from < new Date(attendance.date) &&
		(to ? new Date(attendance.date) < to : true)
	)
}
