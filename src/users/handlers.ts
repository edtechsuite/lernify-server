import { FastifyInstance } from 'fastify'
import { getDecodedToken } from '../utils/request-context'
import { checkPermissions } from './businessLayer/checkPermissions'

export function initHandlers(app: FastifyInstance) {
	// GET /
	app.get<{
		Params: {
			orgId: string
		}
	}>(
		'/:orgId',
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				params: {
					orgId: { type: 'string' },
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const client = await app.pg.connect()
			const { orgId } = req.params

			try {
				// TODO: use ABAC
				const hasPermissions = await checkPermissions(
					client,
					decodedToken.uid,
					orgId
				)
				if (!hasPermissions) {
					reply.status(403)
					return reply.send('Forbidden')
				}
				const result = await client.query(
					`SELECT "role", "users"."name", "users"."id", "users"."createdAt", "users"."email", "users"."outerId" FROM "usersToOrganizations"
					INNER JOIN "users" ON "users"."id" = "usersToOrganizations"."userId"
					WHERE "usersToOrganizations"."organizationId" = $1`,
					[orgId]
				)
				reply.send(result.rows)
			} catch (error: any) {
				throw error
			} finally {
				client.release()
			}
		}
	)
	// GET /:id
	app.get<{
		Params: {
			orgId: string
			id: string
		}
	}>(
		'/:orgId/:id',
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				params: {
					type: 'object',
					properties: {
						orgId: { type: 'number' },
						id: { type: 'number' },
					},
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const client = await app.pg.connect()
			const { orgId, id } = req.params

			try {
				// TODO: use ABAC
				const hasPermissions = await checkPermissions(
					client,
					decodedToken.uid,
					orgId
				)
				if (!hasPermissions) {
					reply.status(403)
					return reply.send('Forbidden')
				}
				const result = await client.query(
					`SELECT "role", "users"."name", "users"."id", "users"."createdAt", "users"."email", "users"."outerId" FROM "usersToOrganizations"
					INNER JOIN "users" ON "users"."id" = "usersToOrganizations"."userId"
					WHERE "usersToOrganizations"."organizationId" = $1 AND "usersToOrganizations"."userId" = $2`,
					[orgId, id]
				)

				if (result.rows.length === 0) {
					reply.status(404)
					return reply.send('Not Found')
				}
				reply.send(result.rows[0])
			} catch (error: any) {
				throw error
			} finally {
				client.release()
			}
		}
	)
	// GET /:outerId
	app.get<{
		Params: {
			orgId: string
			outerId: string
		}
	}>(
		'/byOuterId/:orgId/:outerId',
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				params: {
					type: 'object',
					properties: {
						orgId: { type: 'number' },
						outerId: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const client = await app.pg.connect()
			const { orgId, outerId } = req.params

			console.log('=-= orgId', orgId)
			console.log('=-= outerId', outerId)
			try {
				// TODO: use ABAC
				const hasPermissions = await checkPermissions(
					client,
					decodedToken.uid,
					orgId
				)
				if (!hasPermissions) {
					reply.status(403)
					return reply.send('Forbidden')
				}
				const result = await client.query(
					`SELECT "role", "users"."name", "users"."id", "users"."createdAt", "users"."email", "users"."outerId" FROM "usersToOrganizations"
					INNER JOIN "users" ON "users"."id" = "usersToOrganizations"."userId"
					WHERE "usersToOrganizations"."organizationId" = $1 AND "usersToOrganizations"."userId" = (SELECT id FROM users WHERE "outerId" = $2)`,
					[orgId, outerId]
				)
				console.log('=-= result', result)

				if (result.rows.length === 0) {
					reply.status(404)
					return reply.send('Not Found')
				}
				reply.send(result.rows[0])
			} catch (error: any) {
				console.log('=-= error', error)
				throw error
			} finally {
				client.release()
			}
		}
	)
}
