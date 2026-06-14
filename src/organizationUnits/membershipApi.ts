import { Type } from '@fastify/type-provider-typebox'
import { ServerWithTypes } from '../server'
import {
	getActiveMembershipsForUnit,
	getActiveMembershipsForParticipant,
	getMembershipHistoryForParticipant,
	createMembership,
	endMembership,
	reassignMembership,
} from '../dal/memberships'

export function initMembershipHandlers(app: ServerWithTypes) {
	// GET /units/:unitId/memberships - List active memberships for a unit
	app.get(
		'/:unitId/memberships',
		{
			schema: {
				params: Type.Object({ unitId: Type.String() }),
			},
		},
		async (req) => {
			return getActiveMembershipsForUnit(req.params.unitId)
		}
	)

	// POST /units/:unitId/memberships - Assign participant to unit
	app.post(
		'/:unitId/memberships',
		{
			schema: {
				params: Type.Object({ unitId: Type.String() }),
				body: Type.Object({
					participantId: Type.Integer(),
					subjectType: Type.Optional(Type.String()),
					effectiveFrom: Type.Optional(Type.String()),
				}),
			},
		},
		async (req, reply) => {
			const result = await createMembership({
				unitId: req.params.unitId,
				participantId: req.body.participantId,
				subjectType: req.body.subjectType,
				effectiveFrom: req.body.effectiveFrom ? new Date(req.body.effectiveFrom) : null,
			})
			if ('error' in result) {
				return reply.status(400).send({ error: result.error })
			}
			return result
		}
	)

	// POST /units/memberships/:id/end - End an active membership
	app.post(
		'/memberships/:id/end',
		{
			schema: {
				params: Type.Object({ id: Type.String() }),
				body: Type.Object({
					effectiveTo: Type.String(),
				}),
			},
		},
		async (req, reply) => {
			const error = await endMembership(req.params.id, {
				effectiveTo: new Date(req.body.effectiveTo),
			})
			if (error) return reply.status(400).send({ error })
			return { success: true }
		}
	)

	// POST /units/memberships/:id/reassign - Reassign to a different unit
	app.post(
		'/memberships/:id/reassign',
		{
			schema: {
				params: Type.Object({ id: Type.String() }),
				body: Type.Object({
					newUnitId: Type.String(),
				}),
			},
		},
		async (req, reply) => {
			const result = await reassignMembership(req.params.id, req.body.newUnitId)
			if ('error' in result) {
				return reply.status(400).send({ error: result.error })
			}
			return result
		}
	)
}

export function initParticipantMembershipHandlers(app: ServerWithTypes) {
	// GET /students/:id/memberships - Active memberships for a participant
	app.get(
		'/:id/memberships',
		{
			schema: {
				params: Type.Object({ id: Type.Integer() }),
			},
		},
		async (req) => {
			return getActiveMembershipsForParticipant(req.params.id)
		}
	)

	// GET /students/:id/memberships/history - Full membership history for a participant
	app.get(
		'/:id/memberships/history',
		{
			schema: {
				params: Type.Object({ id: Type.Integer() }),
			},
		},
		async (req) => {
			return getMembershipHistoryForParticipant(req.params.id)
		}
	)
}
