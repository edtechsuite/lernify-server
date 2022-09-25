import { FastifyInstance, FastifyRequest } from 'fastify'
import {
	checkOrgPermissions,
	getOrganizationByIdQuery,
} from '../dal/organizations'

export function setCurrentOrganizationToRequest(app: FastifyInstance) {
	app.decorateRequest('organization', null)

	app.addHook('preHandler', async (request: FastifyRequest<RouteConfig>) => {
		// Trying to get `orgId` from request whatever it is
		const orgId =
			request.body?.orgId || request.params?.orgId || request.query?.orgId

		if (!orgId) {
			// No organization
			return
		}

		const { user } = request
		if (!user) {
			// Without user we can't check permissions and set organization
			return
		}
		const pool = await app.pg.pool
		const hasAccess = await checkOrgPermissions(pool, user.outerId, orgId)
		if (!hasAccess) {
			// User doesn't have access to this organization
			return
		}
		const result = await getOrganizationByIdQuery(pool, orgId)
		request.organization = result.rows[0]
	})
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
