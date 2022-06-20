import 'fastify'

declare module 'fastify' {
	interface FastifyInstance {
		verifyJWT: verifyJWTFunc
		getAuthSchema: () => FastifySchema
	}
}

interface verifyJWTFunc {
	(request: FastifyRequest, reply: FastifyReply, done: () => void): string
}
