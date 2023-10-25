export { Mailer } from './email'
import { Emailer } from './types'

declare module 'fastify' {
	interface FastifyRequest {
		mailer: Emailer
	}
}
