import { getFirestore } from 'firebase-admin/firestore'

export async function getEvents(
	orgKey: string,
	filter?: EventsFilterFb,
	pagination?: { limit: number; offset: number }
) {
	const { limit = 20, offset = 0 } = pagination ?? {}
	const { from, object, subject, to, type } = filter ?? {}

	const db = getFirestore()
	const collectionRef = db.collection(`organizations/${orgKey}/events`)

	let query = collectionRef.limit(limit).offset(offset)

	if (type) {
		query = query.where('type', '==', type)
	}
	if (from) {
		query = query.where('date', '>=', from.getTime())
	}
	if (to) {
		query = query.where('date', '>=', to.getTime())
	}
	if (object) {
		query = query.where('object', '==', object)
	}
	if (subject) {
		query = query.where('subject', '==', subject)
	}

	const querySnapshot = await query.get()

	return querySnapshot.docs.map((doc) => {
		const data = doc.data()

		return {
			...data,
			date: new Date(data.date.seconds * 1000),
		} as EventRecordFirebase
	})
}

export async function createEvent(orgKey: string, event: EventRecordFirebase) {
	const db = getFirestore()
	await db.collection(`organizations/${orgKey}/events`).add(event)
}

export type EventsFilterFb = {
	type?: 'activityArchivedUpdated' | 'editActivity' | 'createActivity'
	from?: Date
	to?: Date
	subject?: number
	object?: number
}

export type EventRecordFirebase = {
	type: string
	date: Date
	subject?: number
	object?: number
	parserVersion: string
	data?: any
}
