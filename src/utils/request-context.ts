import { FastifyRequest } from 'fastify'
import { DecodedIdToken } from 'firebase-admin/auth'

export function getDecodedToken(req: FastifyRequest) {
	return req.requestContext.get('decodedIdToken') as DecodedIdToken
}
