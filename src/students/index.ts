import { FastifyInstance } from 'fastify'
import { initHandlers } from './handlers'
import { initMigrationHandlers } from './migrationHandlers'
import { initParticipantMembershipHandlers } from '../organizationUnits/membershipApi'

export default (app: FastifyInstance, opts: any, done: () => void) => {
	initHandlers(app)

	initMigrationHandlers(app)

	initParticipantMembershipHandlers(app)

	app.log.info('"Students" service initialized')

	done()
}
