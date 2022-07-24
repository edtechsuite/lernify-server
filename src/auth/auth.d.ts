import { DecodedIdToken } from 'firebase-admin/auth'
import { User } from '../users/types'

declare module 'fastify' {
	interface FastifyRequest {
		user?: User
		decodedIdToken?: DecodedIdToken
	}
}
