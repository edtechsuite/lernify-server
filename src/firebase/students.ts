import { getFirestore } from 'firebase-admin/firestore'
import { StudentRecordFirebase } from '../students/types'

export async function getStudents(
	orgKey: string
): Promise<StudentRecordFirebase[]> {
	const db = getFirestore()
	const studentsRef = await db
		.collection(`organizations/${orgKey}/students`)
		.listDocuments()

	return Promise.all(
		studentsRef.map(async (doc) => {
			const snapshot = await doc.get()
			const data = snapshot.data() as unknown as Omit<
				StudentRecordFirebase,
				'id'
			>

			return {
				id: doc.id,
				...data,
			}
		})
	)
}
