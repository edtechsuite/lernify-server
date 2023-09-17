import { AttendanceRecordFirebase } from '../../firebase/types'

export function getAttendanceMap(
	attendances: AttendanceRecordFirebase[]
): [ReportMap, string[]] {
	const [map, activitiesId] = attendances.reduce<[ReportMap, string[]]>(
		(acc, attendance) => {
			const [map, activitiesId] = acc
			let internalMap = map.get(attendance.group)
			if (!internalMap) {
				internalMap = new Map()
				map.set(attendance.group, internalMap)
			}
			Object.entries(attendance.attended).forEach(([key, values]) => {
				const array = internalMap?.get(key) || []
				array.push(values || false)
				internalMap?.set(key, array)
			})

			return [map, activitiesId.concat([attendance.group])]
		},
		[new Map(), []]
	)

	return [map, [...new Set(activitiesId)]]
}

export type ReportMap = Map<string, Map<string, boolean[]>>
