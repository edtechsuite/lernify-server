import 'fastify'

declare module 'fastify' {
	interface FastifyInstance {
		verifyJWT: verifyJWTFunc
		getAuthSchema: () => FastifySchema
		verifyOrgAccess: (
			request: FastifyRequest<RouteConfig>,
			reply: FastifyReply
		) => Promise<undefined>
	}
}

interface verifyJWTFunc {
	(request: FastifyRequest, reply: FastifyReply, done: () => void): string
}
