import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { getLastTokenReset, validateToken } from '../auth/tokenization'
import { ServerWithTypes } from '../server'
import { UserPrisma } from '../users/types'
import { prisma } from '../utils/prisma'

export function initDecorators(app: FastifyInstance) {
	app.decorate('verifyApiToken', verifyApiToken)

	return app as B2BFastifyInstance
}

async function verifyApiToken(request: FastifyRequest, reply: FastifyReply) {
	const token = request.headers['authorization']

	if (!token) {
		return reply.status(401).send('Unauthorized')
	}

	try {
		const profile = await validateToken(token, async (id, prefix) => {
			return await getProfileFromToken(id)
		})

		if (!profile) {
			return reply.status(401).send('Unauthorized')
		}
		request.b2bProfile = profile
	} catch (error) {
		return reply.status(401).send('Unauthorized')
	}
}

async function getProfileFromToken(id: string) {
	const tokenData = await prisma.api_tokens.findUnique({
		where: { id },
	})

	if (!tokenData) {
		return null
	}
	const user = await prisma.users.findUnique({
		where: { id: tokenData.userId },
	})
	if (!user) {
		return null
	}
	return {
		...user,
		lastTokenReset: getLastTokenReset(tokenData.lastReset),
	}
}

export interface B2BFastifyInstance extends ServerWithTypes {
	verifyApiToken: DecoratorFunc
}
declare module 'fastify' {
	interface FastifyRequest {
		b2bProfile: UserPrisma | null
	}
}

interface DecoratorFunc {
	(request: FastifyRequest, reply: FastifyReply, done: () => void): void
}
