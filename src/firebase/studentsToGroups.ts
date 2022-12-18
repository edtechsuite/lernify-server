import { getFirestore } from 'firebase-admin/firestore'
import { StudentsToGroupRecordFirebase } from '../activities/types'

export async function getStudentsToGroups(
	orgKey: string
): Promise<StudentsToGroupRecordFirebase[]> {
	const db = getFirestore()
	const ref = await db
		.collection(`organizations/${orgKey}/studentsToGroups`)
		.listDocuments()

	return Promise.all(
		ref.map(async (doc) => {
			const snapshot = await doc.get()
			const data = snapshot.data() as unknown as Omit<
				StudentsToGroupRecordFirebase,
				'id'
			>

			return {
				id: doc.id,
				...data,
			}
		})
	)
}
