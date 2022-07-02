import { getFirestore } from 'firebase-admin/firestore'
import { OrganizationRecordFirebase } from '../organizations/types'
import { UserRecordFirebase } from './users'

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

export async function createOrganization(
	data: OrganizationRecordFirebase,
	user: UserRecordFirebase
) {
	const db = getFirestore()
	await db.collection('organizations').doc(data.id).set(data)
	await db.collection(`organizations/${data.id}/users`).doc(user.id).set(user)
}
