import { calculateRate } from './calculateRate'

describe('calculateRate', () => {
	it('should return an array of report records with the correct rate', () => {
		const attendancesMap = new Map([
			[
				'activity1',
				new Map([
					['participant1', [true, false, true]],
					['participant2', [false, true, true]],
					['participant3', [false, false, false]],
				]),
			],
			[
				'activity2',
				new Map([
					['participant1', [true, true, true]],
					['participant3', [false, false, true]],
				]),
			],
		])

		const activities = [
			{ id: 1, name: 'Activity 1', outerId: 'activity1' },
			{ id: 2, name: 'Activity 2', outerId: 'activity2' },
		]

		const participants = [
			{ id: 1, name: 'Participant 1', outerId: 'participant1' },
			{ id: 2, name: 'Participant 2', outerId: 'participant2' },
			{ id: 3, name: 'Participant 3', outerId: 'participant3' },
		]

		const result = calculateRate(attendancesMap, activities, participants)

		expect(result).toEqual([
			{
				activityId: 1,
				activityName: 'Activity 1',
				activityOuterId: 'activity1',
				attended: 2,
				participantId: 1,
				participantName: 'Participant 1',
				rate: 0.6667,
				total: 3,
			},
			{
				activityId: 1,
				activityName: 'Activity 1',
				activityOuterId: 'activity1',
				attended: 2,
				participantId: 2,
				participantName: 'Participant 2',
				rate: 0.6667,
				total: 3,
			},
			{
				activityId: 1,
				activityName: 'Activity 1',
				activityOuterId: 'activity1',
				attended: 0,
				participantId: 3,
				participantName: 'Participant 3',
				rate: 0,
				total: 3,
			},
			{
				activityId: 2,
				activityName: 'Activity 2',
				activityOuterId: 'activity2',
				attended: 3,
				participantId: 1,
				participantName: 'Participant 1',
				rate: 1,
				total: 3,
			},
			{
				activityId: 2,
				activityName: 'Activity 2',
				activityOuterId: 'activity2',
				attended: 1,
				participantId: 3,
				participantName: 'Participant 3',
				rate: 0.3333,
				total: 3,
			},
		])
	})
})
