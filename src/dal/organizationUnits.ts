import { v4 } from 'uuid'
import { prisma } from '../utils/prisma'

export type OrgUnitCreate = {
	name: string
	organizationId: number
	parentId?: string | null
	sortOrder?: number
}

export type OrgUnitUpdate = {
	name?: string
	sortOrder?: number
	parentId?: string | null
}

/** Fetch the full flat list of units for an organization (non-archived by default). */
export async function getOrgUnits(
	organizationId: number,
	includeArchived = false,
) {
	return prisma.organizationUnit.findMany({
		where: {
			organizationId,
			...(includeArchived ? {} : { archivedAt: null }),
		},
		orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
	})
}

/** Fetch a single unit, verified to belong to the given organization. */
export async function getOrgUnit(id: string, organizationId: number) {
	return prisma.organizationUnit.findFirst({
		where: { id, organizationId },
		include: { units: true, parent: true },
	})
}

/** Create a unit and insert its ancestry rows within a transaction. */
export async function createOrgUnit(data: OrgUnitCreate) {
	const id = v4()
	return prisma.$transaction(async (tx) => {
		const unit = await tx.organizationUnit.create({
			data: {
				id,
				name: data.name,
				organizationId: data.organizationId,
				parentId: data.parentId || null,
				sortOrder: data.sortOrder ?? 0,
			},
		})

		// Self-referencing ancestry row (depth 0)
		await tx.organizationUnitAncestry.create({
			data: { ancestorId: id, descendantId: id, depth: 0 },
		})

		// Inherit ancestor rows from parent
		if (data.parentId) {
			const parentAncestors = await tx.organizationUnitAncestry.findMany({
				where: { descendantId: data.parentId },
			})
			await tx.organizationUnitAncestry.createMany({
				data: parentAncestors.map((a) => ({
					ancestorId: a.ancestorId,
					descendantId: id,
					depth: a.depth + 1,
				})),
			})
		}

		return unit
	})
}

/** Update name and/or sortOrder of a unit. Re-parent via reparentOrgUnit. */
export async function updateOrgUnit(
	id: string,
	organizationId: number,
	data: OrgUnitUpdate,
) {
	return prisma.organizationUnit.updateMany({
		where: { id, organizationId },
		data: {
			...(data.name !== undefined ? { name: data.name } : {}),
			...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
		},
	})
}

/** Archive a unit (soft-delete). Does NOT cascade to children. */
export async function archiveOrgUnit(id: string, organizationId: number) {
	return prisma.organizationUnit.updateMany({
		where: { id, organizationId, archivedAt: null },
		data: { archivedAt: new Date() },
	})
}

/**
 * Re-parent a unit with cycle detection.
 * Returns an error string on validation failure, null on success.
 */
export async function reparentOrgUnit(
	id: string,
	organizationId: number,
	newParentId: string | null,
	maxDepth = 10,
): Promise<string | null> {
	return prisma.$transaction(async (tx) => {
		// Verify unit belongs to organization
		const unit = await tx.organizationUnit.findFirst({
			where: { id, organizationId },
		})
		if (!unit) return 'Unit not found'

		if (newParentId) {
			// Verify new parent belongs to same organization
			const parent = await tx.organizationUnit.findFirst({
				where: { id: newParentId, organizationId },
			})
			if (!parent) return 'New parent not found in organization'
			if (parent.archivedAt) return 'Cannot move unit under an archived parent'

			// Cycle detection: id must not be an ancestor of newParentId
			const isCycle = await tx.organizationUnitAncestry.findFirst({
				where: { ancestorId: id, descendantId: newParentId },
			})
			if (isCycle) return 'Re-parent would create a cycle'

			// Depth check
			const parentDepthRow = await tx.organizationUnitAncestry.findFirst({
				where: { descendantId: newParentId, depth: { gte: 0 } },
				orderBy: { depth: 'desc' },
			})
			const newDepth = (parentDepthRow?.depth ?? 0) + 1
			if (newDepth >= maxDepth)
				return `Re-parent would exceed maximum depth of ${maxDepth}`
		}

		// Remove all ancestry edges that pass through `id` as a descendant link from its old ancestors
		const oldAncestorIds = (
			await tx.organizationUnitAncestry.findMany({
				where: { descendantId: id, depth: { gt: 0 } },
				select: { ancestorId: true },
			})
		).map((r) => r.ancestorId)

		if (oldAncestorIds.length > 0) {
			// Remove edges: old ancestors -> id and old ancestors -> id's descendants
			const descendantIds = (
				await tx.organizationUnitAncestry.findMany({
					where: { ancestorId: id },
					select: { descendantId: true },
				})
			).map((r) => r.descendantId)

			await tx.organizationUnitAncestry.deleteMany({
				where: {
					ancestorId: { in: oldAncestorIds },
					descendantId: { in: descendantIds },
				},
			})
		}

		// Insert new ancestry edges from newParent ancestors -> id's descendants
		if (newParentId) {
			const newParentAncestors = await tx.organizationUnitAncestry.findMany({
				where: { descendantId: newParentId },
			})
			const myDescendants = await tx.organizationUnitAncestry.findMany({
				where: { ancestorId: id },
			})
			const rows = newParentAncestors.flatMap((anc) =>
				myDescendants.map((desc) => ({
					ancestorId: anc.ancestorId,
					descendantId: desc.descendantId,
					depth: anc.depth + desc.depth + 1,
				})),
			)
			if (rows.length > 0) {
				await tx.organizationUnitAncestry.createMany({ data: rows })
			}
		}

		// Update the unit's parentId
		await tx.organizationUnit.update({
			where: { id },
			data: { parentId: newParentId },
		})

		return null
	})
}

/** Return all descendant unit IDs for a given unit (includes self). */
export async function getDescendantUnitIds(unitId: string): Promise<string[]> {
	const rows = await prisma.organizationUnitAncestry.findMany({
		where: { ancestorId: unitId },
		select: { descendantId: true },
	})
	return rows.map((r) => r.descendantId)
}
