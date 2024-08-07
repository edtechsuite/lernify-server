import { FastifyInstance } from 'fastify'
import { getUserByOuterId } from '../dal/getUserByOuterId'
import { getDecodedToken } from '../utils/request-context'
import { checkPermissions } from './businessLayer/checkPermissions'
import { updateUser as deprecatedUpdateUser } from './businessLayer/editUser'
import { confirmInvitation, inviteUser } from './businessLayer/invite'
import { ServerWithTypes } from '../server'
import { getUsers } from './businessLayer/getUsers'
import { Type } from '@fastify/type-provider-typebox'
import { getUserOfOrganization } from './businessLayer/getUser'
import { updateUser } from './businessLayer/updateUser'

export function initHandlers(app: ServerWithTypes) {
	// GET me
	app.get(
		'/me',
		{
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			reply.send(req.user)
		}
	)

	app.register(adminProtectedUsers)

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

	// put /:userId
	app.put<{
		Body: {
			name: string
		}
		Params: {
			userId: number
		}
	}>(
		'/:userId',
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				body: {
					type: 'object',
					properties: {
						name: { type: 'string' },
					},
				},
				params: {
					type: 'object',
					required: ['userId'],
					properties: {
						userId: { type: 'number' },
					},
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const pool = await app.pg.pool
			const { name } = req.body
			const { userId } = req.params
			const { user } = req
			// TODO: use ABAC
			const updatingItself = user?.id === userId
			const isSysAdmin = user?.systemRole === 'system-administrator'
			const hasPermissions = updatingItself || isSysAdmin
			if (!hasPermissions) {
				reply.status(403)
				return reply.send('Forbidden')
			}

			return await (
				await deprecatedUpdateUser(pool, { id: userId, name })
			).rows[0]
		}
	)

	// TODO: move to organization module
	app.post<{
		Body: {
			email: string
			role: string
			orgId: number
		}
	}>(
		'/invite',
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				body: {
					type: 'object',
					properties: {
						email: { type: 'string' },
						role: { type: 'string' },
						orgId: { type: 'number' },
					},
				},
			},
			preHandler: [app.verifyJWT, app.verifyOrgAccess],
		},
		async (req, reply) => {
			// TODO: ensure admin rights
			const decodedToken = getDecodedToken(req)
			const client = await app.pg.connect()
			const { email, role, orgId } = req.body
			try {
				const invite = await inviteUser(decodedToken.uid, email, orgId, role)

				// TODO: probably we need to use `env` variable for the hostname in the production
				const link = `${req.headers.origin}/invite/confirm/${invite.token}`

				await req.mailer.invite({
					email,
					link,
					orgName: invite.organizations.name,
					userName: invite.updatedByUsers.name,
				})

				return invite
			} catch (error: any) {
				throw error
			} finally {
				client.release()
			}
		}
	)

	// TODO: move to organization module
	app.post<{
		Body: {
			token: string
			name: string
		}
	}>(
		'/confirmInvitation',
		{
			schema: {
				body: {
					type: 'object',
					required: ['name', 'token'],
					properties: {
						name: { type: 'string' },
						token: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const client = await app.pg.pool
			const { token, name } = req.body

			if (!decodedToken.email) {
				reply.status(400)
				return reply.send('Email is absent in the auth token')
			}

			const user = await getUserByOuterId(client, decodedToken.uid)
			const [code, message] = await confirmInvitation(
				client,
				token,
				decodedToken.email,
				user,
				name
			)

			reply.code(code).send(message)
		}
	)
}

function adminProtectedUsers(
	app: ServerWithTypes,
	opts: any,
	done: () => void
) {
	app.addHook(
		'preHandler',
		app.auth([app.verifyOrgAccess, app.ensureUserIsSystemAdmin], {
			relation: 'or',
		})
	)

	app.get(
		'/',
		{
			schema: {},
		},
		async (req, reply) => {
			if (!req.organization) {
				reply.status(400)
				return { message: 'Organization not found' }
			}
			return getUsers(req.organization.id)
		}
	)

	app.get(
		'/:id',
		{
			schema: {
				params: Type.Object({
					id: Type.Number(),
				}),
			},
		},
		async (req, reply) => {
			if (!req.organization) {
				reply.status(400)
				return { message: 'Organization not found' }
			}
			return getUserOfOrganization(req.params.id, req.organization.id)
		}
	)

	app.patch(
		'/:id',
		{
			schema: {
				params: Type.Object({
					id: Type.Number(),
				}),
				body: Type.Object({
					nameInOrganization: Type.String(),
					role: Type.String(),
				}),
			},
		},
		async (req, reply) => {
			if (!req.organization) {
				reply.status(400)
				return { message: 'Organization not found' }
			}
			return updateUser(req.organization.id, req.params.id, req.body)
		}
	)

	done()
}
