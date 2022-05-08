import 'fastify'

declare module 'fastify' {
	interface FastifyInstance {
		verifyJWT: verifyJWTFunc
	}
}

interface verifyJWTFunc {
	(request: FastifyRequest, reply: FastifyReply, done: () => void): string
}
