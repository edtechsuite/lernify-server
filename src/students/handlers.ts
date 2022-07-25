import { FastifyInstance } from 'fastify'
import { getStudentsByOrg } from '../dal/students'
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
			const client = await app.pg.connect()
			try {
				const result = await getStudentsByOrg(client, req.params.orgId)
				reply.send(result.rows)
			} catch (error: any) {
				throw error
			} finally {
				client.release()
			}
		},
	})
	// // GET by id
	// app.get<{
	// 	Params: {
	// 		id: string
	// 	}
	// }>(
	// 	'/:id',
	// 	{
	// 		schema: {
	// 			headers: {
	// 				Authorization: { type: 'string' },
	// 			},
	// 		},
	// 		preHandler: [app.verifyJWT],
	// 	},
	// 	async (req, reply) => {
	// 		const { id } = req.params
	// 		const client = await app.pg.connect()
	// 		try {
	// 			const result = await client.query(
	// 				`SELECT * FROM "organizations"
	// 				INNER JOIN "usersToOrganizations" ON "organizations"."id" = "usersToOrganizations"."organizationId"
	// 				WHERE "usersToOrganizations"."userId" = (SELECT "id" FROM "users" WHERE "outerId"=$1) AND "organizations"."id" = $2 AND "organizations"."deleted" IS FALSE`,
	// 				[decodedToken.uid, id]
	// 			)
	// 			reply.send(result.rows)
	// 		} catch (error: any) {
	// 			throw error
	// 		} finally {
	// 			client.release()
	// 		}
	// 	}
	// )
	// // Create organization
	// app.post<{
	// 	Body: StudentCreate
	// }>(
	// 	`/`,
	// 	{
	// 		schema: {
	// 			headers: {
	// 				Authorization: { type: 'string' },
	// 			},
	// 			body: {
	// 				type: 'object',
	// 				required: ['key', 'name'],
	// 				properties: {
	// 					key: { type: 'string' },
	// 					name: { type: 'string' },
	// 				},
	// 			},
	// 		},
	// 		preHandler: [app.verifyJWT],
	// 	},
	// 	async (req, reply) => {
	// 		const client = await app.pg.connect()
	// 		try {
	// 			return await createOrganization(app, decodedToken.uid, req.body)
	// 		} catch (error: any) {
	// 			if (error.constraint === 'organizations_key_key') {
	// 				reply.code(400).send({
	// 					message: `Organization key ${req.body.key} already exists`,
	// 				})
	// 				return
	// 			}
	// 			throw error
	// 		} finally {
	// 			client.release()
	// 		}
	// 	}
	// )
	// // Create organization
	// app.delete<{
	// 	Params: {
	// 		id: string
	// 	}
	// }>(
	// 	`/:id`,
	// 	{
	// 		schema: {
	// 			headers: {
	// 				Authorization: { type: 'string' },
	// 			},
	// 			params: {
	// 				type: 'object',
	// 				required: ['id'],
	// 				properties: {
	// 					id: { type: 'string' },
	// 				},
	// 			},
	// 		},
	// 		preHandler: [app.verifyJWT],
	// 	},
	// 	async (req, reply) => {
	// 		const client = await app.pg.connect()
	// 		try {
	// 			const result = await removeOrganization(
	// 				app,
	// 				decodedToken.uid,
	// 				req.params.id
	// 			)
	// 			return result.rows[0]
	// 		} catch (error: any) {
	// 			throw error
	// 		} finally {
	// 			client.release()
	// 		}
	// 	}
	// )
}
