import { FastifyInstance } from 'fastify'
import {
	createStudentQuery,
	getStudentByIdQuery,
	getStudentsByOrg,
	removeStudentQuery,
} from '../dal/students'
import { StudentCreate } from './types'
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
	// POST
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
			const pool = await app.pg.pool

			if (!req.user || !req.organization) {
				return reply.code(403).send('Forbidden')
			}

			const result = await createStudentQuery(pool, {
				...req.body,
				organization: req.organization.id,
				updatedBy: req.user.id,
			})

			reply.send(result.rows[0])
		}
	)
}
