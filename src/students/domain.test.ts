import { recalculateCurrentAttendanceRate } from './domain'

describe('recalculateCurrentAttendanceRate', () => {
	it('should correctly calculate attendance rate', async () => {
		const attendeeToActivity = [
			{
				activityOuterId: 'activity1',
				participantOuterId: 'participant1',
				startDate: new Date('2022-01-01'),
				endDate: new Date('2022-01-31'),
			},
		]
		const attendances = [
			{
				date: new Date('2022-01-15').getTime(),
				attended: { participant1: true },
				group: 'activity1',
			},
			{
				date: new Date('2022-01-20').getTime(),
				attended: { participant1: false },
				group: 'activity1',
			},
		]

		const result = await recalculateCurrentAttendanceRate(
			attendeeToActivity,
			attendances
		)

		expect(result).toEqual([
			{
				...attendeeToActivity[0],
				allRecords: 2,
				attendanceRate: 0.5,
			},
		])
	})
	it('should skip attendances that aut of range', async () => {
		const attendeeToActivity = [
			{
				activityOuterId: 'activity1',
				participantOuterId: 'participant1',
				startDate: new Date('2022-01-01'),
				endDate: new Date('2022-01-31'),
			},
		]
		const attendances = [
			{
				date: new Date('2022-02-15').getTime(),
				attended: { participant1: true },
				group: 'activity1',
			},
		]

		const result = await recalculateCurrentAttendanceRate(
			attendeeToActivity,
			attendances
		)

		expect(result).toEqual([
			{
				...attendeeToActivity[0],
				allRecords: 0,
				attendanceRate: 0,
			},
		])
	})

	it('should calculate attendance for record without end date', async () => {
		const attendeeToActivity = [
			{
				activityOuterId: 'activity1',
				participantOuterId: 'participant1',
				startDate: new Date('2022-01-01'),
				endDate: null,
			},
		]
		const attendances = [
			{
				date: new Date('2022-01-15').getTime(),
				attended: { participant1: true },
				group: 'activity1',
			},
		]

		const result = await recalculateCurrentAttendanceRate(
			attendeeToActivity,
			attendances
		)

		expect(result).toEqual([
			{
				...attendeeToActivity[0],
				allRecords: 1,
				attendanceRate: 1,
			},
		])
	})

	it('should throw an error if attendance record does not have participant', async () => {
		const attendeeToActivity = [
			{
				activityOuterId: 'activity1',
				participantOuterId: 'participant1',
				startDate: new Date('2022-01-01'),
				endDate: new Date('2022-01-31'),
			},
		]
		const attendances = [
			{
				date: new Date('2022-01-15').getTime(),
				attended: {},
				group: 'activity1',
			},
		]

		await expect(() =>
			recalculateCurrentAttendanceRate(attendeeToActivity, attendances)
		).toThrow('Attendance record doesn`t have participant')
	})
})
