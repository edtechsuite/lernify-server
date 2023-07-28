import { DecodedIdToken } from 'firebase-admin/auth'
import { User } from '../users/types'
import { Profile, ProfileWithUser } from '../profiles/model'

declare module 'fastify' {
	interface FastifyRequest {
		user: User | null
		profile: ProfileWithUser | null
		decodedIdToken: DecodedIdToken | null
	}
}
