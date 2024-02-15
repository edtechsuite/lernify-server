import * as fbEvents from '../../firebase/events'

export function getEvents(
	orgKey: string,
	filter: EventFilter,
	pagination?: { limit: number; offset: number }
) {
	return fbEvents.getEvents(orgKey, filter, pagination)
}

type EventFilter = fbEvents.EventsFilterFb
