import { getFirestore } from 'firebase-admin/firestore'

export async function getUsers(): Promise<UserRecordFirebase[]> {
	const db = getFirestore()
	const ref = await db.collection('users').listDocuments()

	return Promise.all(
		ref.map(async (doc) => {
			const snapshot = await doc.get()
			const data = snapshot.data() as unknown as Omit<UserRecordFirebase, 'id'>

			return {
				id: doc.id,
				...data,
			}
		})
	)
}

type UserRecordFirebase = {
	id: string
	email: string
	name: string
	organizations: string[]
}
