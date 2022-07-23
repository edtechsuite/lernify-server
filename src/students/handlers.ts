import { FastifyInstance } from 'fastify'
import { getDecodedToken } from '../utils/request-context'
// import { createOrganization } from './businessLayer/createOrganization'
// import { removeOrganization } from './businessLayer/removeOrganization'
// import { StudentCreate } from './types'

export function initHandlers(app: FastifyInstance) {
	// // GET /all by user
	// app.route({
	// 	method: 'GET',
	// 	url: `/`,
	// 	schema: {
	// 		headers: {
	// 			Authorization: { type: 'string' },
	// 		},
	// 	},
	// 	preHandler: [app.verifyJWT],
	// 	handler: async (req, reply) => {
	// 		const decodedToken = getDecodedToken(req)
	// 		const client = await app.pg.connect()
	// 		try {
	// 			const result = await client.query(
	// 				`SELECT *, "organizations"."id" FROM "organizations"
	// 					INNER JOIN "usersToOrganizations" ON "organizations"."id" = "usersToOrganizations"."organizationId"
	// 					WHERE "usersToOrganizations"."userId" = (SELECT "id" FROM "users" WHERE "outerId"=$1) AND "organizations"."deleted" IS FALSE`,
	// 				[decodedToken.uid]
	// 			)
	// 			reply.send(result.rows)
	// 		} catch (error: any) {
	// 			throw error
	// 		} finally {
	// 			client.release()
	// 		}
	// 	},
	// })
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
	// 		const decodedToken = getDecodedToken(req)
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
	// 		const decodedToken = getDecodedToken(req)
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
	// 		const decodedToken = getDecodedToken(req)
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
