import { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { OrgHeaderEnsured } from '../auth/types'
import { prisma } from '../utils/prisma'
import { ActivityCreate, ActivityUpdate } from './types'

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
		handler: async (req) => {
			return await prisma.activities.findFirst({
				where: {
					id: parseInt(req.params.id, 10),
					organizationId: req.organization!.id,
				},
			})
		},
	})

	// GET by params
	app.get<{
		Querystring: {
			performerId: string
		}
		Headers: OrgHeaderEnsured
	}>('/', {
		schema: {
			querystring: {
				type: 'object',
				properties: {
					performerId: { type: 'string' },
				},
			},
		},
		preHandler: [app.verifyOrgAccess],
		handler: async (req) => {
			const result = await prisma.activities.findMany({
				where: {
					organizationId: req.organization!.id,
					performerId: req.query.performerId
						? parseInt(req.query.performerId, 10)
						: undefined,
					deleted: false,
					archived: false,
				},
			})

			return result
		},
	})

	// GET by participant
	app.route<{
		Params: {
			participantId: string
		}
		Querystring: {
			date?: string
		}
		Headers: OrgHeaderEnsured
	}>({
		method: 'GET',
		url: `/byParticipant/:participantId`,
		schema: {
			params: {
				type: 'object',
				properties: {
					participantId: { type: 'string' },
				},
			},
			querystring: {
				type: 'object',
				properties: {
					date: { type: 'string' },
				},
			},
		},
		preHandler: [app.verifyOrgAccess],
		handler: async (req, reply) => {
			if (!req.organization) {
				return reply.status(401).send('Unauthorized')
			}
			const participant = await prisma.students.findFirstOrThrow({
				where: {
					organization: req.organization.id,
					id: parseInt(req.params.participantId, 10),
				},
			})

			return await prisma.activities.findMany({
				where: {
					deleted: false,
					organizationId: req.organization.id,
					studentsToActivities: {
						some: {
							participantId: participant.id,
							startDate: {
								lte: req.query.date ? new Date(req.query.date) : undefined,
							},
							...(req.query.date
								? {
										OR: [
											{
												endDate: null,
											},
											{
												endDate: {
													gte: new Date(req.query.date),
												},
											},
										],
								  }
								: {}),
						},
					},
				},
			})
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
			const data = await prisma.activities.findFirstOrThrow({
				where: {
					organizationId: req.organization!.id,
					id: parseInt(req.params.id, 10),
				},
			})
			const result = await prisma.activities.update({
				data: {
					name: req.body.name ?? data.name,
					performerId: req.body.performerId ?? data.performerId,
					archived: req.body.archived ?? data.archived,
					updatedAt: new Date(),
					updatedBy: req.user!.id,
				},
				where: {
					id: data.id,
				},
				select: returnActivity,
			})

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
			const activity = await prisma.activities.findFirstOrThrow({
				where: {
					organizationId: req.organization!.id,
					id: activityId,
				},
			})
			const participant = await prisma.students.findFirstOrThrow({
				where: {
					organization: req.organization!.id,
					id: participantId,
				},
			})

			await prisma.studentsToActivities.create({
				data: {
					participantId: participant.id,
					activityId: activity.id,
					startDate: new Date(),
					endDate: null,
					updatedBy: req.user?.id,
				},
			})

			reply.status(201).send('ok')
		}
	)

	// Unassign participant
	app.delete<{
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
			const activityId = parseInt(req.params.activityId, 10)
			const participantId = parseInt(req.params.participantId, 10)
			const activity = await prisma.activities.findFirstOrThrow({
				where: {
					organizationId: req.organization!.id,
					id: activityId,
				},
			})
			const participant = await prisma.students.findFirstOrThrow({
				where: {
					organization: req.organization!.id,
					id: participantId,
				},
			})

			await prisma.studentsToActivities.updateMany({
				where: {
					participantId: participant.id,
					activityId: activity.id,
					endDate: null,
				},
				data: {
					endDate: new Date(),
				},
			})

			reply.status(200).send('ok')
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
