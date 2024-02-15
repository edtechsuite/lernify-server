import { BaseEvent } from './baseEvent'

export class ActivityArchivedUpdatedEvent extends BaseEvent {
	data: boolean
	constructor({
		data,
		date,
		subject,
		object,
	}: {
		date: Date
		subject: number
		object: number
		data: boolean
	}) {
		super('activityArchivedUpdated', date, '1.0', subject, object)
		this.data = data
	}
}
