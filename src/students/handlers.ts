import { FastifyInstance } from 'fastify'
import { unassignParticipantFromAllActivities } from '../activities/businessLayer/participation'
import { isDatabaseError } from '../dal/databaseError'
import {
	createStudentQuery,
	getStudentByIdQuery,
	getStudentByNameAndOrganizationQuery,
	updateStudentQuery,
} from '../dal/students'
import { prisma } from '../utils/prisma'
import { StudentCreate, StudentUpdate } from './types'
import { recalculateCurrentAttendanceRate } from './domain'
import { getAllAttendances } from '../firebase/attendances'

export function initHandlers(app: FastifyInstance) {
	app.get(`/`, {
		schema: {
			params: {
				type: 'object',
				properties: {
					orgId: { type: 'string' },
				},
			},
		},
		preHandler: [app.verifyOrgAccess],
		handler: async (req, reply) => {
			return prisma.students.findMany({
				where: {
					organization: req.organization?.id,
					deleted: false,
				},
				include: {
					studentsToActivities: {
						select: {
							currentAttendanceRate: true,
						},
					},
				},
			})
		},
	})

	// GET by activity
	app.route<{
		Params: {
			activity: string
		}
		Querystring: {
			startDate?: string
			endDate?: string
		}
	}>({
		method: 'GET',
		url: `/byActivity/:activity`,
		schema: {
			params: {
				type: 'object',
				properties: {
					activity: { type: 'string' },
				},
				required: ['activity'],
			},
			querystring: {
				type: 'object',
				properties: {
					startDate: { type: 'string' },
					endDate: { type: 'string' },
				},
			},
		},
		preHandler: [app.verifyOrgAccess],
		handler: async (req) => {
			const result = await prisma.studentsToActivities.findMany({
				where: {
					OR: [
						{
							endDate: null,
						},
						{
							endDate: {
								gte: req.query.endDate
									? new Date(req.query.endDate)
									: undefined,
							},
						},
					],
					activityId: parseInt(req.params.activity, 10),
					startDate: {
						lte: req.query.startDate
							? new Date(req.query.startDate)
							: undefined,
					},
					activity: {
						is: {
							organizationId: req.organization?.id
								? req.organization.id
								: undefined,
						},
					},
				},
				include: { participant: true },
			})

			return result.map((item) => item.participant)
		},
	})

	// GET by id
	app.get<{
		Params: {
			id: number
		}
	}>(
		'/:id',
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				params: {
					type: 'object',
					properties: {
						id: { type: 'number' },
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req, reply) => {
			const { id } = req.params
			const pool = await app.pg.pool
			const result = await getStudentByIdQuery(pool, id)
			if (result.rows.length === 0) {
				return reply.code(404).send('Not found')
			}
			reply.send(result.rows[0])
		}
	)

	app.delete<{
		Params: {
			id: number
		}
	}>(
		'/:id',
		{
			schema: {
				params: {
					type: 'object',
					properties: {
						id: { type: 'number' },
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req, reply) => {
			const { id } = req.params
			await unassignParticipantFromAllActivities(req.organization!.id, id)
			const result = await prisma.students.update({
				where: {
					id,
				},
				data: {
					deleted: true,
					updatedBy: req.user!.id,
					updatedAt: new Date(),
				},
			})

			reply.send(result)
		}
	)

	app.post<{
		Body: StudentCreate
	}>(
		'/',
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				body: {
					type: 'object',
					required: ['name', 'tags', 'outerId'],
					properties: {
						name: { type: 'string' },
						tags: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
						outerId: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req, reply) => {
			const pool = app.pg.pool

			if (!req.user || !req.organization) {
				return reply.code(403).send('Forbidden')
			}

			try {
				const result = await createStudentQuery(pool, {
					...req.body,
					organization: req.organization.id,
					updatedBy: req.user.id,
				})

				reply.send(result.rows[0])
			} catch (error) {
				if (isDatabaseError(error)) {
					if (error.code === '23505') {
						// Unique key violation
						return reply.code(400).send(error.message)
					}
				}

				throw error
			}
		}
	)

	// Recalculate rate
	app.post(
		'/recalculateRate',
		{
			preHandler: [app.verifyOrgAccess],
		},
		async (req, reply) => {
			// TODO: verify admin rights

			const attendeeToActivity = await prisma.studentsToActivities.findMany({
				where: {
					activity: {
						organizationId: req.organization!.id,
					},
				},
				include: {
					activity: true,
					participant: true,
				},
			})
			const [{ attendances }] = await getAllAttendances([req.organization!.key])
			const recalculatedData = await recalculateCurrentAttendanceRate(
				attendeeToActivity.map((a2a) => ({
					...a2a,
					activityOuterId: a2a.activity!.outerId,
					participantOuterId: a2a.participant!.outerId,
				})),
				attendances
			)

			await prisma.$transaction(
				recalculatedData.map((d) =>
					prisma.studentsToActivities.update({
						where: {
							id: d.id,
						},
						data: {
							eventsNumber: d.allRecords,
							currentAttendanceRate: d.attendanceRate,
						},
					})
				)
			)

			reply.send('Done')
		}
	)
	// PUT
	app.put<{
		Body: StudentUpdate
		Params: {
			id: number
		}
	}>(
		'/:id',
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				params: {
					type: 'object',
					properties: {
						id: { type: 'number' },
					},
				},
				body: {
					type: 'object',
					required: ['name', 'tags'],
					properties: {
						name: { type: 'string' },
						tags: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req, reply) => {
			const pool = await app.pg.pool
			const { id } = req.params

			if (!req.user || !req.organization) {
				return reply.code(403).send('Forbidden')
			}

			const result = await updateStudentQuery(pool, id, {
				...req.body,
				updatedBy: req.user.id,
			})

			reply.send(result.rows[0])
		}
	)

	// does student exist in organization?
	app.get<{
		Params: {
			name: string
		}
	}>(
		'/search/:name',
		{
			schema: {
				params: {
					type: 'object',
					properties: {
						name: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req, reply) => {
			const { name } = req.params
			const pool = await app.pg.pool

			// Searching the student by the name
			const strateSearch = await getStudentByNameAndOrganizationQuery(
				pool,
				name.trim(),
				req.organization!.id
			)
			if (strateSearch.rows.length > 0) {
				return reply.send(strateSearch.rows[0])
			}

			// Searching the student by the reversed first and last name
			const reverseName = name.trim().split(' ').reverse().join(' ')
			const reverseSearch = await getStudentByNameAndOrganizationQuery(
				pool,
				reverseName,
				req.organization!.id
			)
			if (reverseSearch.rows.length > 0) {
				return reply.send(reverseSearch.rows[0])
			}

			reply.send(null)
		}
	)
}
