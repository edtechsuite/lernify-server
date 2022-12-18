import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { checkOrgPermissions } from '../dal/organizations'
import { verifyIdToken } from './firebase'
import { OrgHeader } from './types'

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

		// Trying to get `orgKey` from request whatever it is
		const orgKey =
			request.headers['x-organization'] ||
			request.body?.orgKey ||
			request.params?.orgKey ||
			request.query?.orgKey

		if (!orgKey) {
			return reply
				.status(400)
				.send(
					`"orgKey" property is required in the request body, params, query or header ("x-organization")`
				)
		}

		const pool = app.pg.pool

		try {
			const decodedToken = await verifyIdToken(idToken)
			const hasAccess = await checkOrgPermissions(
				pool,
				decodedToken.uid,
				orgKey
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

type RouteConfig = {
	Body?: {
		orgKey?: string
	}
	Params?: {
		orgKey?: string
	}
	Querystring?: {
		orgKey?: string
	}
	Headers: OrgHeader
}
