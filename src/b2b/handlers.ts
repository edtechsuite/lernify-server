import { Type } from '@sinclair/typebox'
import { v4 } from 'uuid'
import { B2BFastifyInstance } from './decorators'
import { generateToken } from '../auth/tokenization'
import { prisma } from '../utils/prisma'

export function initHandlers(app: B2BFastifyInstance) {
	app.post('/generateApiToken', {
		preHandler: [app.verifyOrgAccess],
		handler: async (req) => {
			const tokenData = await prisma.api_tokens.upsert({
				create: {
					id: v4(),
					lastReset: new Date(),
					userId: req.user!.id,
					organizationId: req.organization!.id,
				},
				update: {
					lastReset: new Date(),
					userId: req.user!.id,
					organizationId: req.organization!.id,
				},
				where: {
					organizationId: req.organization!.id,
				},
			})

			// Token should be generated after `lastReset` timestamp
			// Time precision is in seconds, but `lastReset` is in milliseconds
			// so need to postpone creation for at least 1s
			await wait(1000)
			return generateToken(tokenData.id)
		},
	})

	// Protected by API token
	app.register(async function protectedByToken(protectedApp, opts) {
		protectedApp.addHook('preHandler', protectedApp.auth([app.verifyApiToken]))

		protectedApp.get('/test', {
			schema: {
				headers: Type.Object({
					authorization: Type.String(),
				}),
			},
			handler: async (req) => {
				return req.b2bProfile
			},
		})
	})
}

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
