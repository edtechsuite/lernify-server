import { getFirestore } from 'firebase-admin/firestore'
import { GroupRecordFirebase } from '../activities/types'

export async function getGroups(
	orgKey: string
): Promise<GroupRecordFirebase[]> {
	const db = getFirestore()
	const ref = await db
		.collection(`organizations/${orgKey}/groups`)
		.listDocuments()

	return Promise.all(
		ref.map(async (doc) => {
			const snapshot = await doc.get()
			const data = snapshot.data() as unknown as Omit<GroupRecordFirebase, 'id'>

			return {
				id: doc.id,
				...data,
			}
		})
	)
}
