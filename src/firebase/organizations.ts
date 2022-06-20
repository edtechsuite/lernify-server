import { getFirestore } from 'firebase-admin/firestore'
import { OrganizationRecordFirebase } from '../organizations/types'

export async function getOrganizations(): Promise<
	OrganizationRecordFirebase[]
> {
	const db = getFirestore()
	const ref = await db.collection('organizations').listDocuments()

	return Promise.all(
		ref.map(async (doc) => {
			const snapshot = await doc.get()
			const data = snapshot.data() as unknown as Omit<
				OrganizationRecordFirebase,
				'id'
			>

			return {
				id: doc.id,
				...data,
			}
		})
	)
}
