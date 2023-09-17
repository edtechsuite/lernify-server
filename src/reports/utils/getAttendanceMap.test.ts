import { getAttendanceMap } from './getAttendanceMap'

describe('getAttendanceMap', () => {
	it('should return a map of attendance records and a list of activity IDs', () => {
		const attendances = [
			{
				group: 'group1',
				date: new Date().getTime(),
				teacher: 'teacherId',
				attended: {
					activity1: true,
					activity2: false,
				},
			},
			{
				group: 'group2',
				date: new Date().getTime(),
				teacher: 'teacherId',
				attended: {
					activity1: false,
					activity2: true,
				},
			},
		]

		const [map, activitiesId] = getAttendanceMap(attendances)

		expect(map).toEqual(
			new Map([
				[
					'group1',
					new Map([
						['activity1', [true]],
						['activity2', [false]],
					]),
				],
				[
					'group2',
					new Map([
						['activity1', [false]],
						['activity2', [true]],
					]),
				],
			])
		)

		expect(activitiesId).toEqual(['group1', 'group2'])
	})
})
