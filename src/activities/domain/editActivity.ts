import { FastifyRequest } from 'fastify'
import { prisma } from '../../utils/prisma'
import { ActivityRecord } from '../types'
import {
	addEvent,
	ActivityArchivedUpdatedEvent,
	EditActivityEvent,
} from '../../events'

export async function editActivity(
	id: number,
	data: Partial<ActivityUpdate>,
	req: FastifyRequest
) {
	const existing = await prisma.activities.findFirstOrThrow({
		where: {
			organizationId: req.organization!.id,
			id,
		},
		include: {
			performer: true,
			organization: true,
		},
	})
	const updated = await prisma.activities.update({
		data: {
			name: data.name ?? existing.name,
			performerId: data.performerId,
			archived: data.archived ?? existing.archived,
			updatedAt: new Date(),
			updatedBy: req.user!.id,
		},
		where: {
			id: existing.id,
		},
		include: {
			performer: true,
		},
	})
	if (existing.performerId !== updated.performerId) {
		// TODO: should be in separate module notified via the event bus
		// TODO: check if email is belongs to somebody in the system and active
		const host = req.headers.referer ?? `${req.protocol}://${req.hostname}/`
		const link = `${host}${existing.organization.key}/groups/${existing.id}`
		if (existing.performer) {
			req.mailer.assignment({
				email: existing.performer.email,
				isAssign: false,
				link,
			})
		}
		if (updated.performer) {
			req.mailer.assignment({
				email: updated.performer.email,
				isAssign: true,
				link,
			})
		}
	}

	await addEvent(
		req.organization!.key,
		new EditActivityEvent(new Date(), updated.id, req.user!.id, {
			id: updated.id,
		})
	)
	if (existing.archived !== updated.archived) {
		await addEvent(
			req.organization!.key,
			new ActivityArchivedUpdatedEvent({
				data: updated.archived,
				date: new Date(),
				object: updated.id,
				subject: req.user!.id,
			})
		)
	}
	return updated
}

export type ActivityUpdate = Pick<
	ActivityRecord,
	'performerId' | 'name' | 'archived'
>
