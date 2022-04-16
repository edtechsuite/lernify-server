import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { createLogger } from '../logger'

export function initAuthService() {
	const logger = createLogger('auth')
	initializeApp({
		credential: applicationDefault(),
	})
	logger.log('info', `Auth service initialized`)
}
