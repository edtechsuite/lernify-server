import { DecodedIdToken } from 'firebase-admin/auth'
import { User } from '../users/types'
import { OrganizationRecord } from './types'

declare module 'fastify' {
	interface FastifyRequest {
		organization: OrganizationRecord | null
	}
}
