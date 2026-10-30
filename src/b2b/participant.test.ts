jest.mock('../utils/prisma', () => ({
	prisma: {
		$queryRaw: jest.fn(),
	},
}))

jest.mock('../firebase/attendances', () => ({
	getAttendancesByGroup: jest.fn(() => Promise.resolve([])),
}))

import { prisma } from '../utils/prisma'
import { getParticipants } from './domain.ts/participant'

describe('getParticipants', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('returns unfiltered list and total in a single DB call when filter is absent or whitespace', async () => {
		const dbStudents = [
			{
				id: 1,
				name: 'Alice Smith',
				tags: ['vip-member'],
				outerId: 'student-1',
				studentsToActivities: [],
			},
			{
				id: 2,
				name: 'Bob Jones',
				tags: ['regular'],
				outerId: 'student-2',
				studentsToActivities: [],
			},
		]
		;(prisma.$queryRaw as jest.Mock).mockResolvedValue([
			{
				total: 2,
				data: dbStudents,
			},
		])

		const [list, total] = await getParticipants({
			page: 0,
			pageSize: 10,
			filter: '   ',
			organization: { id: 10, key: 'org-key' },
		})

		expect(prisma.$queryRaw).toHaveBeenCalledTimes(1)
		const [, orgId, pattern] = (prisma.$queryRaw as jest.Mock).mock.calls[0]
		expect(orgId).toBe(10)
		expect(pattern).toBeNull()
		expect(total).toBe(2)
		expect(list).toEqual([
			{
				id: 1,
				name: 'Alice Smith',
				tags: ['vip-member'],
				activities: [],
			},
			{
				id: 2,
				name: 'Bob Jones',
				tags: ['regular'],
				activities: [],
			},
		])
	})

	it('returns filtered list and total in a single DB call when filter is provided', async () => {
		const matchedDbStudents = [
			{
				id: 1,
				name: 'Alice Smith',
				tags: ['vip-member'],
				outerId: 'student-1',
				studentsToActivities: [
					{
						activity: {
							id: 100,
							name: 'Math 101',
							createdAt: '2026-01-01T00:00:00.000Z',
							outerId: 'act-100',
							performer: {
								id: 7,
								name: 'Teacher One',
								email: 't1@example.com',
							},
						},
					},
				],
			},
			{
				id: 3,
				name: 'Carol White',
				tags: ['vip-member'],
				outerId: 'student-3',
				studentsToActivities: [],
			},
			{
				id: 5,
				name: 'Dan Brown',
				tags: ['vip-member'],
				outerId: 'student-5',
				studentsToActivities: [],
			},
		]
		;(prisma.$queryRaw as jest.Mock).mockResolvedValue([
			{
				total: 3,
				data: matchedDbStudents,
			},
		])

		const [list, total] = await getParticipants({
			page: 0,
			pageSize: 10,
			filter: 'vip',
			organization: { id: 10, key: 'org-key' },
		})

		expect(prisma.$queryRaw).toHaveBeenCalledTimes(1)
		const [, orgId, pattern] = (prisma.$queryRaw as jest.Mock).mock.calls[0]
		expect(orgId).toBe(10)
		expect(pattern).toBe('%vip%')
		expect(total).toBe(3)
		expect(list).toEqual([
			{
				id: 1,
				name: 'Alice Smith',
				tags: ['vip-member'],
				activities: [
					{
						id: 100,
						name: 'Math 101',
						performer: {
							id: 7,
							name: 'Teacher One',
							email: 't1@example.com',
						},
						rate: 0,
						attended: 0,
						total: 0,
					},
				],
			},
			{
				id: 3,
				name: 'Carol White',
				tags: ['vip-member'],
				activities: [],
			},
			{
				id: 5,
				name: 'Dan Brown',
				tags: ['vip-member'],
				activities: [],
			},
		])
	})
})
