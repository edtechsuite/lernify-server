import { Type } from '@sinclair/typebox'
import { ServerWithTypes } from '../server'
import { unassignParticipantFromAllActivities } from '../activities/businessLayer/participation'
import { isDatabaseError } from '../dal/databaseError'
import {
	findStudents,
	findStudentsByActivity,
	getStudentByIdQuery,
	getStudentByNameAndOrganizationQuery,
	updateStudentQuery,
} from '../dal/students'
import { prisma } from '../utils/prisma'
import { StudentUpdate } from './types'
import { createParticipant } from './domain/createParticipant'

export function initHandlers(app: ServerWithTypes) {
	app.addHook('preHandler', app.auth([app.verifyOrgAccess]))

	app.get<{
		Querystring: {
			filter?: string
		}
	}>(`/`, {
		schema: {
			params: {
				type: 'object',
				properties: {
					orgId: { type: 'string' },
				},
			},
			querystring: {
				type: 'object',
				properties: {
					filter: { type: 'string' },
				},
			},
		},
		handler: async (req) => {
			return findStudents(req.organization!.id, req.query.filter)
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
			filter?: string
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
					filter: { type: 'string' },
				},
			},
		},
		handler: async (req) => {
			return findStudentsByActivity({
				activityId: parseInt(req.params.activity, 10),
				organizationId: req.organization?.id,
				startDate: req.query.startDate
					? new Date(req.query.startDate)
					: undefined,
				endDate: req.query.endDate
					? new Date(req.query.endDate)
					: undefined,
				filter: req.query.filter,
			})
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

	app.post(
		'/',
		{
			schema: {
				body: Type.Object({
					name: Type.String(),
					tags: Type.Array(Type.String()),
					outerId: Type.String(),
					unit: Type.Optional(Type.String()),
					email: Type.Optional(Type.String()),
				}),
			},
		},
		async (req, reply) => {
			if (!req.user || !req.organization) {
				return reply.code(403).send('Forbidden')
			}

			try {
				const result = await createParticipant(
					req.body,
					req.organization.id,
					req.user.id
				)

				reply.send(result)
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
		},
		async (req, reply) => {
			const pool = await app.pg.pool
			const { id } = req.params

			if (!req.user || !req.organization) {
				return reply.code(403).send('Forbidden')
			}

			const result = await updateStudentQuery(pool, id, {
				...req.body,
				tags: req.body.tags.map((t) => t.trim()),
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
