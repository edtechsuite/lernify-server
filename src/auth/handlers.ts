import { FastifyInstance } from 'fastify'
import { getDecodedToken } from '../utils/request-context'
import { createUser, getUserProfile } from './firebase'

export function initHandlers(app: FastifyInstance) {
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
					reply
						.code(404)
						.send(
							'User not found. Looks like the database is not in sync with the firebase auth. Please synchronize the database.'
						)
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
			const fbUser = await createUser(email, password)
			const client = await app.pg.connect()
			try {
				const result = await client.query(
					'INSERT INTO users ( name, email, outerId ) VALUES ( $1, $2, $3 ) returning id, name, email',
					[name, email, fbUser.uid]
				)
				reply.send(result.rows[0])
			} catch (error) {
				throw error
			} finally {
				client.release()
			}
		}
	)

	app.post(
		`/syncProfile`,
		{
			preHandler: [app.verifyJWT],
		},
		async (req, reply) => {
			const decodedToken = getDecodedToken(req)
			const { email, uid } = decodedToken
			req.log.info(`Synchronizing user profile ${uid}`)
			let name = ''
			try {
				const fbUserProfile = await getUserProfile(uid)
				name = fbUserProfile.name
			} catch (error) {
				// Can't get the user profile from firebase.
				// Using the email as the name
				name = email || ''
			}
			const client = await app.pg.connect()
			try {
				const result = await client.query(
					'INSERT INTO users ( name, email, "outerId" ) VALUES ( $1, $2, $3 ) returning id, name, email',
					[name, email, uid]
				)
				reply.send(result.rows[0])
			} catch (error) {
				throw error
			} finally {
				client.release()
			}
		}
	)
}
