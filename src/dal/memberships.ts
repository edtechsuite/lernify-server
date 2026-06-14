import { v4 } from 'uuid'
import { prisma } from '../utils/prisma'

export type MembershipCreate = {
	unitId: string
	participantId: number
	subjectType?: string
	effectiveFrom?: Date | null
}

export type MembershipEnd = {
	effectiveTo: Date
}

/** Get active memberships for a unit (effectiveTo is null = still active). */
export async function getActiveMembershipsForUnit(unitId: string) {
	return prisma.unit2participant.findMany({
		where: { unitId, effectiveTo: null },
		include: { participant: true },
	})
}

/** Get active memberships for a participant across all units. */
export async function getActiveMembershipsForParticipant(participantId: number) {
	return prisma.unit2participant.findMany({
		where: { participantId, effectiveTo: null },
		include: { unit: true },
	})
}

/** Get full membership history for a participant. */
export async function getMembershipHistoryForParticipant(participantId: number) {
	return prisma.unit2participant.findMany({
		where: { participantId },
		include: { unit: true },
		orderBy: { effectiveFrom: 'desc' },
	})
}

/**
 * Create a new membership record.
 * Validates that the target unit is not archived and no duplicate active membership exists.
 * Returns an error string on failure, the created record on success.
 */
export async function createMembership(data: MembershipCreate): Promise<{ error: string } | { id: string }> {
	// Verify unit is not archived
	const unit = await prisma.organizationUnit.findUnique({ where: { id: data.unitId } })
	if (!unit) return { error: 'Unit not found' }
	if (unit.archivedAt) return { error: 'Cannot assign to archived unit' }

	// Validate effective dates if both provided
	if (data.effectiveFrom) {
		// effectiveTo not set at creation, so just validate effectiveFrom is a valid date (no-op here)
	}

	// Check duplicate active membership
	const existing = await prisma.unit2participant.findFirst({
		where: {
			unitId: data.unitId,
			participantId: data.participantId,
			effectiveTo: null,
		},
	})
	if (existing) return { error: 'Active membership already exists for this unit' }

	const record = await prisma.unit2participant.create({
		data: {
			id: v4(),
			unitId: data.unitId,
			participantId: data.participantId,
			subjectType: data.subjectType ?? 'student',
			effectiveFrom: data.effectiveFrom ?? new Date(),
			effectiveTo: null,
		},
	})

	return { id: record.id }
}

/**
 * End an active membership (soft close).
 * Used for reassignment or voluntary ending.
 */
export async function endMembership(
	id: string,
	data: MembershipEnd
): Promise<string | null> {
	const membership = await prisma.unit2participant.findUnique({ where: { id } })
	if (!membership) return 'Membership not found'
	if (membership.effectiveTo) return 'Membership is already ended'

	// Validate effectiveTo > effectiveFrom if effectiveFrom is set
	if (membership.effectiveFrom && data.effectiveTo <= membership.effectiveFrom) {
		return 'effectiveTo must be after effectiveFrom'
	}

	await prisma.unit2participant.update({
		where: { id },
		data: { effectiveTo: data.effectiveTo },
	})

	return null
}

/**
 * Reassign a participant from one unit to another.
 * Ends the existing active membership and creates a new one atomically.
 */
export async function reassignMembership(
	existingId: string,
	newUnitId: string
): Promise<{ error: string } | { id: string }> {
	const existing = await prisma.unit2participant.findUnique({ where: { id: existingId } })
	if (!existing) return { error: 'Membership not found' }
	if (existing.effectiveTo) return { error: 'Membership is already ended' }

	const newUnit = await prisma.organizationUnit.findUnique({ where: { id: newUnitId } })
	if (!newUnit) return { error: 'Target unit not found' }
	if (newUnit.archivedAt) return { error: 'Cannot reassign to archived unit' }

	return prisma.$transaction(async (tx) => {
		const now = new Date()
		await tx.unit2participant.update({
			where: { id: existingId },
			data: { effectiveTo: now },
		})
		const created = await tx.unit2participant.create({
			data: {
				id: v4(),
				unitId: newUnitId,
				participantId: existing.participantId,
				subjectType: existing.subjectType,
				effectiveFrom: now,
				effectiveTo: null,
			},
		})
		return { id: created.id }
	})
}
