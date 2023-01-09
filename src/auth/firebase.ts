import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

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

export async function verifyIdToken(idToken: string) {
	const auth = getAuth()
	const decodedToken = await auth.verifyIdToken(idToken)
	return decodedToken
}

export function createUser(email: string, password: string) {
	const auth = getAuth()
	return auth.createUser({ email, password })
}

export function getUser(email: string) {
	const auth = getAuth()
	return auth.getUserByEmail(email)
}

export async function getOrCreateUser(email: string, password: string) {
	try {
		return await getUser(email)
	} catch {
		return await createUser(email, password)
	}
}
