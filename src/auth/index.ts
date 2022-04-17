import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { createLogger } from '../logger'

const logger = createLogger('auth')

export async function getUserProfile(id: string) {
	const db = getFirestore()
	const userRef = await db.collection('users').doc(id)
	const doc = await userRef.get()
	const data = doc.data()
	if (!data) {
		throw new Error(`User with id "${id}" doesn't exists in the database`)
	}

	return data
}

logger.log('info', `Auth service initialized`)
