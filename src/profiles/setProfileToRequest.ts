import { FastifyInstance } from 'fastify'
import { getProfileByUserAndOrg } from './domain'

export function setProfileToRequest(app: FastifyInstance) {
	app.decorateRequest('profile', null)

	app.addHook('preHandler', async (request) => {
		const user = request.user
		const organization = request.organization

		if (organization && user) {
			const profile = await getProfileByUserAndOrg(user.id, organization.id)
			request.profile = profile
			app.log.info(
				`Profile preHandler: Profile was successfully set (id: ${profile.id}, name: ${profile.name})`
			)
		}
	})
}
