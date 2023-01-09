import { FastifyInstance } from 'fastify'
import { prisma } from '../utils/prisma'
import { getDecodedToken } from '../utils/request-context'
import { getOrCreateUser } from './firebase'
import { syncProfile } from './logic/syncProfile'

export function initHandlers(app: FastifyInstance) {
	// GET /me
	app.route({
		method: 'GET',
		url: `/me`,
		schema: {
			headers: {
				Authorization: { type: 'string' },
			},
		},
		preHandler: [app.verifyJWT],
		handler: async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const client = await app.pg.connect()

			try {
				const result = await client.query(
					'SELECT id, name, email FROM users WHERE "outerId"=$1',
					[decodedToken.uid]
				)
				if (result.rows.length === 0) {
					// Looks like the user is not in the database
					// Database is not in sync with the firebase auth
					const { email, uid } = decodedToken
					req.log.info(`Synchronizing user profile ${uid}`)
					const result = await syncProfile(app, email, uid)

					reply.send(result)
				} else {
					reply.send(result.rows[0])
				}
			} catch (error: any) {
				throw error
			} finally {
				client.release()
			}
		},
	})

	// POST /register
	app.post<{
		Body: {
			name: string
			email: string
			password: string
		}
	}>(
		`/register`,
		{
			schema: {
				body: {
					name: { type: 'string' },
					email: { type: 'string' },
					password: { type: 'string' },
				},
			},
		},
		async (req, reply) => {
			const { name, email, password } = req.body
			const fbUser = await getOrCreateUser(email, password)
			const dbUser = await prisma.users.findUnique({
				where: {
					email,
				},
			})

			if (dbUser) {
				reply.code(409).send('User already exists')
				return
			}

			return await prisma.users.create({
				data: {
					name,
					email,
					outerId: fbUser.uid,
				},
				select: {
					id: true,
					name: true,
					email: true,
				},
			})
		}
	)

	// POST /syncProfile
	app.post(
		`/syncProfile`,
		{
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const { email, uid } = decodedToken
			req.log.info(`Synchronizing user profile ${uid}`)
			const result = await syncProfile(app, email, uid)
			reply.send(result)
		}
	)
}
