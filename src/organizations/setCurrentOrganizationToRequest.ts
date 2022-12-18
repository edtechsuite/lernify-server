import { FastifyInstance, FastifyRequest } from 'fastify'
import { OrgHeader } from '../auth/types'
import {
	checkOrgPermissions,
	getOrganizationByKeyQuery,
} from '../dal/organizations'

export function setCurrentOrganizationToRequest(app: FastifyInstance) {
	app.decorateRequest('organization', null)

	app.addHook('preHandler', async (request: FastifyRequest<RouteConfig>) => {
		// Trying to get `orgKey` from request whatever it is
		const orgKey =
			request.headers['x-organization'] ||
			request.body?.orgKey ||
			request.params?.orgKey ||
			request.query?.orgKey

		if (!orgKey) {
			// No organization
			return
		}

		const { user } = request
		if (!user) {
			// Without user we can't check permissions and set organization
			return
		}
		const pool = await app.pg.pool
		const hasAccess = await checkOrgPermissions(pool, user.outerId, orgKey)
		if (!hasAccess) {
			// User doesn't have access to this organization
			return
		}
		const result = await getOrganizationByKeyQuery(pool, orgKey)
		request.organization = result.rows[0]
	})
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
