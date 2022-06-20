import { getFirestore } from 'firebase-admin/firestore'

export async function getCollectionData<T>(collection: string): Promise<T[]> {
	const db = getFirestore()
	const ref = await db.collection(collection).listDocuments()

	return Promise.all(
		ref.map(async (doc) => {
			const snapshot = await doc.get()
			const data = snapshot.data() as unknown as T

			return {
				id: doc.id,
				...data,
			}
		})
	)
}
