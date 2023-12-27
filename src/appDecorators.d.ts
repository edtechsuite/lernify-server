import 'fastify'

declare module 'fastify' {
	interface FastifyInstance {
		verifyJWT: DecoratorFunc
		ensureUserExists: DecoratorFunc
		ensureUserIsSystemAdmin: DecoratorFunc
		getAuthSchema: () => FastifySchema
		verifyOrgAccess: (
			request: FastifyRequest<RouteConfig>,
			reply: FastifyReply
		) => Promise<undefined>
	}
}

interface DecoratorFunc {
	(request: FastifyRequest, reply: FastifyReply, done: () => void): void
}
