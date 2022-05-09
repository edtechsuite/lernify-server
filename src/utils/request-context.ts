import { FastifyRequest } from 'fastify'
import { DecodedIdToken } from 'firebase-admin/auth'

export function getDecodedToken(req: FastifyRequest) {
	if (req.requestContext.get('decodedIdToken') === undefined) {
		throw new Error('Decoded id token is not set')
	}
	return req.requestContext.get('decodedIdToken') as DecodedIdToken
}
