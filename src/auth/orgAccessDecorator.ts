import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { PoolClient } from 'pg'
import { verifyIdToken } from './firebase'

export function decorateOrgPermission(app: FastifyInstance) {
	app.decorate('verifyOrgAccess', verifyOrgAccess)

	async function verifyOrgAccess(
		request: FastifyRequest<RouteConfig>,
		reply: FastifyReply
	) {
		// TODO: use `request.user`
		const idToken = request.headers['authorization']

		if (!idToken) {
			return reply.status(401).send('Unauthorized')
		}

		const orgId = request.body?.orgId || request.params?.orgId

		if (!orgId) {
			return reply
				.status(400)
				.send(`"orgId" property is required in the request body or params`)
		}

		const client = await app.pg.connect()

		try {
			const decodedToken = await verifyIdToken(idToken)
			const hasAccess = await checkOrgPermissions(
				client,
				decodedToken.uid,
				orgId
			)
			if (!hasAccess) {
				return reply.status(403).send('Forbidden')
			}
			return
		} catch (error) {
			return reply.status(401).send(error)
		}
	}
}

async function checkOrgPermissions(
	client: PoolClient,
	userOuterId: string,
	orgId: number
) {
	const result = await client.query(
		`SELECT * FROM "usersToOrganizations"
			WHERE "userId" = (SELECT "id" FROM "users" WHERE "outerId"=$1) AND "organizationId" = $2`,
		[userOuterId, orgId]
	)

	return result.rows.length > 0
}

type RouteConfig = {
	Body?: {
		orgId?: number
	}
	Params?: {
		orgId?: number
	}
}
