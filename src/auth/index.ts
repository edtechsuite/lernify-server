import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { createLogger } from '../logger'

const logger = createLogger('auth')

export async function getUserProfile(idToken: string) {
	try {
		// Move to AUTH layer
		const auth = getAuth()
		const decodedToken = await auth.verifyIdToken(idToken)

		const db = getFirestore()
		const userRef = await db.collection('users').doc(decodedToken.uid)
		const doc = await userRef.get()
		if (!doc.exists) {
			throw new Error(
				`User with id "${decodedToken.uid}" doesn't exists in the database`
			)
		}

		return {
			...doc.data(),
		}
	} catch (error: any) {
		logger.error(error.message)
		throw error
	}
}

logger.log('info', `Auth service initialized`)
