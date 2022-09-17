import { FastifyInstance } from 'fastify'
import {
	getStudentByIdQuery,
	getStudentsByOrg,
	removeStudentQuery,
} from '../dal/students'
// import { createOrganization } from './businessLayer/createOrganization'
// import { removeOrganization } from './businessLayer/removeOrganization'
// import { StudentCreate } from './types'

export function initHandlers(app: FastifyInstance) {
	// GET /all by organization
	app.route<{
		Params: {
			orgId: number
		}
	}>({
		method: 'GET',
		url: `/byOrganization/:orgId`,
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
			const pool = await app.pg.pool
			const result = await getStudentsByOrg(pool, req.params.orgId)
			reply.send(result.rows)
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
	// DELETE by id
	app.delete<{
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
			// TODO: remove student to group associations
			const { id } = req.params
			const pool = await app.pg.pool
			const result = await removeStudentQuery(pool, id)
			if (result.rows.length === 0) {
				return reply.code(404).send('Not found')
			}
			reply.send(result.rows[0])
		}
	)
}
