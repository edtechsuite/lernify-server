import { FastifyRequest } from 'fastify'

export function getDecodedToken(req: FastifyRequest) {
	const decodedToken = req.decodedIdToken
	if (!decodedToken) {
		throw new Error('Decoded id token is not set')
	}
	return decodedToken
}
