import { AttendanceRecordFirebase } from '../../firebase/types'

export function calculateRate(
	attendances: AttendanceRecordFirebase[],
	config: { precision?: number } = {}
) {
	const byActivityByAttendee = gatherAttendances(attendances)
	const map = new Map<string, Map<string, AttendanceRateRecord>>()
	byActivityByAttendee.forEach((attendance, key) => {
		map.set(key, calcRateOfActivity(attendance, config))
	})

	return map
}

function calcRateOfActivity(
	attendances: Map<string, boolean[]>,
	config: { precision?: number } = {}
) {
	const map = new Map<string, AttendanceRateRecord>()
	attendances.forEach((attendance, key) => {
		map.set(key, calcRateOfAttendee(attendance, config))
	})

	return map
}
function calcRateOfAttendee(
	attendances: boolean[],
	config: { precision?: number } = {}
) {
	const { precision = 10000 } = config

	if (attendances.length === 0) {
		return {
			rate: 0,
			attended: 0,
			total: 0,
		}
	}
	return {
		rate:
			Math.round(
				(attendances.filter(Boolean).length / attendances.length) * precision
			) / precision,
		attended: attendances.filter(Boolean).length,
		total: attendances.length,
	}
}

function gatherAttendances(attendances: AttendanceRecordFirebase[]) {
	const byActivityByAttendee = new Map<string, Map<string, boolean[]>>()
	attendances.forEach((attendance) => {
		const attended = Object.entries(attendance.attended)
		const mapByAttendee =
			byActivityByAttendee.get(attendance.group) || new Map<string, boolean[]>()
		attended.forEach(([attendee, isAttended]) => {
			const current = mapByAttendee.get(attendee) || []
			if (typeof isAttended === 'boolean') {
				mapByAttendee.set(attendee, [...current, isAttended])
			}
		})

		byActivityByAttendee.set(attendance.group, mapByAttendee)
	})

	return byActivityByAttendee
}

type AttendanceRateRecord = {
	rate: number
	attended: number
	total: number
}
