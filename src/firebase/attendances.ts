import { getFirestore } from 'firebase-admin/firestore'
import { AttendanceRecordFirebase } from './types'

export async function getAttendances(
	orgKey: string,
	range: { from: Date; to: Date }
) {
	const db = getFirestore()
	const collectionRef = db.collection(`organizations/${orgKey}/attendances`)

	const querySnapshot = await collectionRef
		// 'IN' supports up to 30 comparison values.
		// .where('group', 'in', groups)
		.where('date', '>=', range.from.getTime())
		.where('date', '<=', range.to.getTime())
		.get()

	return querySnapshot.docs.map((doc) => doc.data() as AttendanceRecordFirebase)
}

export async function getAttendancesByGroup(
	orgKey: string,
	range: { from: Date; to: Date },
	groupOuterId: string
) {
	const db = getFirestore()
	const collectionRef = db.collection(`organizations/${orgKey}/attendances`)

	const querySnapshot = await collectionRef
		.where('group', '==', groupOuterId)
		.where('date', '>=', range.from.getTime())
		.where('date', '<=', range.to.getTime())
		.get()

	return querySnapshot.docs.map((doc) => doc.data() as AttendanceRecordFirebase)
}
