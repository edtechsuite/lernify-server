import { FastifyInstance } from 'fastify'
import { App } from '../app'
import { mockUserAndOrganizationFromPG } from '../utils/tests'

jest.mock('../utils/prisma', () => ({
	prisma: {
		students: {
			findMany: jest.fn(),
		},
		studentsToActivities: {
			findMany: jest.fn(),
		},
		usersToOrganizations: {
			findFirstOrThrow: jest.fn(() => Promise.resolve({})),
		},
		$queryRaw: jest.fn(),
	},
}))

import { prisma } from '../utils/prisma'

describe('Students endpoints', () => {
	let app: FastifyInstance = undefined as unknown as FastifyInstance

	beforeAll(async () => {
		app = await App()
	})

	afterAll(async () => {
		await app.close()
	})

	beforeEach(() => {
		jest.clearAllMocks()
		mockUserAndOrganizationFromPG(undefined, { id: 10 })
	})

	describe('GET /students', () => {
		it('returns all students without filter', async () => {
			const students = [
				{ id: 1, name: 'Alice Smith', tags: ['math'] },
				{ id: 2, name: 'Bob Jones', tags: ['science'] },
			]
				; (prisma.students.findMany as jest.Mock).mockResolvedValue(students)

			const response = await app.inject({
				method: 'GET',
				url: '/students',
				headers: {
					authorization: 'token',
					'x-organization': 'org-key',
				},
			})

			expect(response.statusCode).toBe(200)
			expect(response.json()).toEqual(students)
			expect(prisma.$queryRaw).not.toHaveBeenCalled()
			expect(prisma.students.findMany).toHaveBeenCalledWith({
				where: {
					organization: 10,
					deleted: false,
				},
			})
		})

		it('ignores whitespace-only filter and returns all students', async () => {
			const students = [{ id: 1, name: 'Alice Smith', tags: [] }]
				; (prisma.students.findMany as jest.Mock).mockResolvedValue(students)

			const response = await app.inject({
				method: 'GET',
				url: '/students?filter=%20%20',
				headers: {
					authorization: 'token',
					'x-organization': 'org-key',
				},
			})

			expect(response.statusCode).toBe(200)
			expect(response.json()).toEqual(students)
			expect(prisma.$queryRaw).not.toHaveBeenCalled()
			expect(prisma.students.findMany).toHaveBeenCalledWith({
				where: {
					organization: 10,
					deleted: false,
				},
			})
		})

		it('filters students by id: { in: matchedIds } when filter is provided', async () => {
			const matchedStudents = [{ id: 1, name: 'Alice Smith', tags: ['math'] }]
				; (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ id: 1 }])
				; (prisma.students.findMany as jest.Mock).mockResolvedValue(
					matchedStudents
				)

			const response = await app.inject({
				method: 'GET',
				url: '/students?filter=ali',
				headers: {
					authorization: 'token',
					'x-organization': 'org-key',
				},
			})

			expect(response.statusCode).toBe(200)
			expect(response.json()).toEqual(matchedStudents)
			expect(prisma.$queryRaw).toHaveBeenCalledTimes(1)
			expect(prisma.students.findMany).toHaveBeenCalledWith({
				where: {
					organization: 10,
					deleted: false,
					id: { in: [1] },
				},
			})
		})
	})

	describe('GET /students/byActivity/:activity', () => {
		it('returns activity participants without filter', async () => {
			const participant = { id: 1, name: 'Alice Smith', tags: [] }
				; (
					prisma.studentsToActivities.findMany as jest.Mock
				).mockResolvedValue([{ participant }])

			const response = await app.inject({
				method: 'GET',
				url: '/students/byActivity/42',
				headers: {
					authorization: 'token',
					'x-organization': 'org-key',
				},
			})

			expect(response.statusCode).toBe(200)
			expect(response.json()).toEqual([participant])
			expect(prisma.$queryRaw).not.toHaveBeenCalled()
			expect(prisma.studentsToActivities.findMany).toHaveBeenCalledWith({
				where: {
					OR: [{ endDate: null }, { endDate: { gte: undefined } }],
					activityId: 42,
					startDate: { lte: undefined },
					activity: {
						is: {
							organizationId: 10,
						},
					},
				},
				include: { participant: true },
			})
		})

		it('filters activity participants by where.participant.is when filter is provided', async () => {
			const participant = { id: 1, name: 'Alice Smith', tags: [] }
				; (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ id: 1 }])
				; (
					prisma.studentsToActivities.findMany as jest.Mock
				).mockResolvedValue([{ participant }])

			const response = await app.inject({
				method: 'GET',
				url: '/students/byActivity/42?filter=ali',
				headers: {
					authorization: 'token',
					'x-organization': 'org-key',
				},
			})

			expect(response.statusCode).toBe(200)
			expect(response.json()).toEqual([participant])
			expect(prisma.$queryRaw).toHaveBeenCalledTimes(1)
			expect(prisma.studentsToActivities.findMany).toHaveBeenCalledWith({
				where: {
					OR: [{ endDate: null }, { endDate: { gte: undefined } }],
					activityId: 42,
					startDate: { lte: undefined },
					activity: {
						is: {
							organizationId: 10,
						},
					},
					participant: {
						is: {
							id: { in: [1] },
						},
					},
				},
				include: { participant: true },
			})
		})
	})
})
