import { BaseEvent } from './baseEvent'

export class EditActivityEvent extends BaseEvent {
	constructor(
		date: Date,
		subject: number,
		object: number,
		public data: { id: number }
	) {
		super('editActivity', date, '1.0', subject, object)
	}
}
