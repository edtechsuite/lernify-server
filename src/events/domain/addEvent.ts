import { EventRecordFirebase, createEvent } from '../../firebase/events'
import { BaseEvent } from '../models/baseEvent'

export function addEvent(orgKey: string, event: BaseEvent) {
	return createEvent(orgKey, event.toJson())
}

export type Event = EventRecordFirebase
