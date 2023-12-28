import { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { OrgHeaderEnsured } from '../auth/types'
import { prisma } from '../utils/prisma'
import { ActivityCreate } from './types'
import { getActivity } from './businessLayer/getActivity'
import { ActivityUpdate, editActivity } from './domain/editActivity'
import { getStudentParticipation } from './domain/participation'
import { addParticipant } from './domain/addParticipant'
import { removeParticipant } from './domain/removeParticipant'

export function initHandlers(app: FastifyInstance) {
	// GET
	app.route<{
		Params: {
			id: string
		}
		Headers: OrgHeaderEnsured
	}>({
		method: 'GET',
		url: `/:id`,
		schema: {
			params: {
				type: 'object',
				properties: {
					id: { type: 'string' },
				},
			},
		},
		preHandler: [app.verifyOrgAccess],
		handler: async (req, reply) => {
			try {
				return await getActivity(
					parseInt(req.params.id, 10),
					req.organization!.id
				)
			} catch (error) {
				if (
					error instanceof PrismaClientKnownRequestError &&
					error.code === 'P2025'
				) {
					return reply.code(404).send(error.message)
				}
			}
		},
	})

	// GET by params
	app.get<{
		Querystring: {
			performerId?: string
			participantId?: string
			date?: string
			archived?: 'true' | 'false' | 'all'
			deleted?: 'true' | 'false' | 'all'
		}
		Headers: OrgHeaderEnsured
	}>('/', {
		schema: {
			querystring: {
				type: 'object',
				properties: {
					performerId: { type: 'string' },
					date: { type: 'string' },
					participantId: { type: 'string' },
					archived: { enum: ['true', 'false', 'all'] },
					deleted: { enum: ['true', 'false', 'all'] },
				},
			},
		},
		preHandler: [app.verifyOrgAccess],
		handler: async (req) => {
			const {
				archived = 'false',
				performerId,
				deleted = 'false',
				participantId,
				date,
			} = req.query
			const result = await prisma.activities.findMany({
				where: {
					organizationId: req.organization!.id,
					performerId: performerId ? Number(performerId) : undefined,
					deleted:
						deleted === 'true' ? true : deleted === 'false' ? false : undefined,
					archived:
						archived === 'true'
							? true
							: archived === 'false'
							? false
							: undefined,
					...(participantId
						? {
								studentsToActivities: {
									some: {
										participantId: Number(participantId),
										startDate: {
											lte: date ? new Date(date) : undefined,
										},
										...(date
											? {
													OR: [
														{
															endDate: null,
														},
														{
															endDate: {
																gte: new Date(date),
															},
														},
													],
											  }
											: {}),
									},
								},
						  }
						: {}),
				},
				include: {
					studentsToActivities: {
						where: {
							participantId: participantId ? Number(participantId) : undefined,
						},
					},
				},
			})

			return result
		},
	})

	app.post<{
		Body: ActivityCreate
		Headers: OrgHeaderEnsured
	}>(
		'/',
		{
			schema: {
				body: {
					type: 'object',
					required: ['name', 'performerId'],
					properties: {
						name: { type: 'string' },
						performerId: {
							anyOf: [
								{
									type: 'null',
								},
								{
									type: 'number',
								},
							],
						},
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req) => {
			const result = await prisma.activities.create({
				data: {
					...req.body,
					outerId: nanoid(),
					organizationId: req.organization!.id,
					updatedBy: req.user!.id,
				},
				select: returnActivity,
			})

			return result
		}
	)

	app.put<{
		Body: Partial<ActivityUpdate>
		Params: {
			id: string
		}
		Headers: OrgHeaderEnsured
	}>(
		'/:id',
		{
			schema: {
				params: {
					type: 'object',
					properties: {
						id: { type: 'string' },
					},
				},
				body: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						performerId: {
							anyOf: [
								{
									type: 'null',
								},
								{
									type: 'number',
								},
							],
						},
						archived: { type: 'boolean' },
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req) => {
			const id = parseInt(req.params.id, 10)
			const result = editActivity(id, req.body, req)

			return result
		}
	)

	app.delete<{
		Params: {
			id: string
		}
		Headers: OrgHeaderEnsured
	}>(
		'/:id',
		{
			schema: {
				params: {
					type: 'object',
					properties: {
						id: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req) => {
			const activityId = parseInt(req.params.id, 10)
			const data = await prisma.activities.findFirstOrThrow({
				where: {
					organizationId: req.organization!.id,
					id: activityId,
				},
			})

			await prisma.studentsToActivities.updateMany({
				where: {
					activityId: data.id,
					endDate: null,
					updatedAt: new Date(),
					updatedBy: req.user!.id,
				},
				data: {
					endDate: new Date(),
				},
			})

			const result = await prisma.activities.update({
				where: {
					id: data.id,
				},
				data: {
					deleted: true,
					updatedAt: new Date(),
					updatedBy: req.user!.id,
				},
				select: returnActivity,
			})

			return result
		}
	)

	// Assign participant
	app.post<{
		Params: {
			activityId: string
			participantId: string
		}
		Headers: OrgHeaderEnsured
	}>(
		'/:activityId/participant/:participantId',
		{
			schema: {
				params: {
					type: 'object',
					properties: {
						activityId: { type: 'string' },
						participantId: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req, reply) => {
			if (!req.user) {
				return reply.status(401).send('Unauthorized')
			}

			const activityId = parseInt(req.params.activityId, 10)
			const participantId = parseInt(req.params.participantId, 10)
			try {
				await addParticipant({
					participantId,
					activityId,
					orgId: req.organization?.id,
					userId: req.user.id,
				})
			} catch (error) {
				if (error instanceof Error) {
					reply.status(400).send(error.message)
					return
				}
				throw error
			}

			reply.status(201).send('ok')
		}
	)

	// Unassign participant
	app.delete<{
		Body: {
			activityId: string
			participantId: string
			leaveReasonComment: string
		}
		Headers: OrgHeaderEnsured
	}>(
		'/participant',
		{
			schema: {
				body: {
					type: 'object',
					required: ['activityId', 'participantId', 'leaveReasonComment'],
					properties: {
						activityId: { type: 'string' },
						participantId: { type: 'string' },
						leaveReasonComment: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req, reply) => {
			const activityId = parseInt(req.body.activityId, 10)
			const participantId = parseInt(req.body.participantId, 10)
			await removeParticipant({
				participantId,
				activityId,
				orgId: req.organization?.id,
				userId: req.user!.id,
				leaveReasonComment: req.body.leaveReasonComment,
			})

			reply.status(200).send('ok')
		}
	)

	app.get<{
		Querystring: {
			participantId?: string
			activityId?: string
			from?: string
			to?: string
		}
		Headers: OrgHeaderEnsured
	}>(
		'/participation',
		{
			schema: {
				querystring: {
					type: 'object',
					properties: {
						participantId: { type: 'string' },
						activityId: { type: 'string' },
						from: { type: 'string' },
						to: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyOrgAccess],
		},
		async (req) => {
			// TODO: check access
			const result = await getStudentParticipation({
				participantId: req.query.participantId
					? Number(req.query.participantId)
					: undefined,
				activityId: req.query.activityId
					? Number(req.query.activityId)
					: undefined,
				from: req.query.from,
				to: req.query.to,
			})

			return result
		}
	)
}

const returnActivity = {
	id: true,
	name: true,
	performerId: true,
	type: true,
	outerId: true,
	deleted: true,
	updatedBy: true,
	createdAt: true,
	updatedAt: true,
	archived: true,
}
