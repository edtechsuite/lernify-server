import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { checkOrgPermissions } from '../dal/organizations'
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

		// Trying to get `orgId` from request whatever it is
		const orgId =
			request.body?.orgId || request.params?.orgId || request.query?.orgId

		if (!orgId) {
			return reply
				.status(400)
				.send(
					`"orgId" property is required in the request body, params or query`
				)
		}

		const pool = await app.pg.pool

		try {
			const decodedToken = await verifyIdToken(idToken)
			const hasAccess = await checkOrgPermissions(pool, decodedToken.uid, orgId)
			if (!hasAccess) {
				return reply.status(403).send('Forbidden')
			}
			return
		} catch (error) {
			return reply.status(401).send(error)
		}
	}
}

type RouteConfig = {
	Body?: {
		orgId?: number
	}
	Params?: {
		orgId?: number
	}
	Querystring?: {
		orgId?: number
	}
}
