import { FastifyInstance } from 'fastify'
import { isUniqueConstraintFailedError, prisma } from '../utils/prisma'
import { getDecodedToken } from '../utils/request-context'
import { createOrganization } from './businessLayer/createOrganization'
import { removeOrganization } from './businessLayer/removeOrganization'
import { OrganizationCreate } from './types'

export function initHandlers(app: FastifyInstance) {
	// GET /all by user
	app.route({
		method: 'GET',
		url: `/`,
		schema: {
			headers: {
				Authorization: { type: 'string' },
			},
		},
		preHandler: [app.verifyJWT],
		handler: async (req, reply) => {
			const user = req.user!

			const result = await prisma.organizations.findMany({
				where: {
					users: {
						some: {
							userId: user.id,
						},
					},
					deleted: false,
				},
				include: {
					users: {
						where: {
							userId: user.id,
						},
					},
				},
			})

			reply.send(result.map((item) => ({ ...item, role: item.users[0].role })))
		},
	})

	// GET by id
	app.get<{
		Params: {
			id: string
		}
	}>(
		'/:id',
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const { id } = req.params

			const client = await app.pg.connect()

			try {
				const result = await client.query(
					`SELECT * FROM "organizations"
					INNER JOIN "usersToOrganizations" ON "organizations"."id" = "usersToOrganizations"."organizationId"
					WHERE "usersToOrganizations"."userId" = (SELECT "id" FROM "users" WHERE "outerId"=$1) AND "organizations"."id" = $2 AND "organizations"."deleted" IS FALSE`,
					[decodedToken.uid, id]
				)
				reply.send(result.rows)
			} catch (error: any) {
				throw error
			} finally {
				client.release()
			}
		}
	)

	// Create organization
	app.post<{
		Body: OrganizationCreate
	}>(
		`/`,
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				body: {
					type: 'object',
					required: ['key', 'name'],
					properties: {
						key: { type: 'string' },
						name: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			try {
				return await createOrganization(decodedToken.uid, req.body, req.user!)
			} catch (error: any) {
				if (isUniqueConstraintFailedError(error)) {
					reply.code(409).send({
						message: `Organization key ${req.body.key} already exists`,
					})

					return
				}

				throw error
			}
		}
	)

	// Create organization
	app.delete<{
		Params: {
			id: string
		}
	}>(
		`/:id`,
		{
			schema: {
				headers: {
					Authorization: { type: 'string' },
				},
				params: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const client = await app.pg.connect()

			try {
				const result = await removeOrganization(
					app,
					decodedToken.uid,
					req.params.id
				)
				return result.rows[0]
			} catch (error: any) {
				throw error
			} finally {
				client.release()
			}
		}
	)

	app.get<{
		Params: {
			token: string
		}
	}>(
		'/inviteInfo/:token',
		{
			schema: {
				params: {
					type: 'object',
					required: ['token'],
					properties: {
						token: { type: 'string' },
					},
				},
			},
			preHandler: [app.verifyJWT],
		},
		async (req, resp) => {
			const invite = await prisma.invites.findFirst({
				where: {
					token: req.params.token,
				},
				include: {
					updatedByUsers: true,
				},
			})

			if (!invite) {
				resp.code(400).send('Invalid token')
				return
			}

			if (invite.email !== req.user?.email) {
				resp.code(400).send('Invalid token')
				return
			}

			if (new Date(invite.dueTo) < new Date()) {
				resp.code(400).send('Token expired')
				return
			}

			const organization = await prisma.organizations.findUnique({
				where: {
					id: invite.organization,
				},
			})

			return {
				organization: {
					name: organization?.name,
				},
				invite: {
					role: invite.role,
					updatedBy: invite.updatedByUsers,
				},
			}
		}
	)
}
