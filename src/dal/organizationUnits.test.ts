/**
 * Unit tests for organizational unit DAL service logic.
 * These tests cover tree integrity, archive rules, and membership validation
 * without hitting the real database (prisma is mocked).
 */

// Mock prisma module
jest.mock('../utils/prisma', () => ({
	prisma: {
		organizationUnit: {
			findFirst: jest.fn(),
			findUnique: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			updateMany: jest.fn(),
		},
		organizationUnitAncestry: {
			create: jest.fn(),
			createMany: jest.fn(),
			findFirst: jest.fn(),
			findMany: jest.fn(),
			deleteMany: jest.fn(),
		},
		unit2participant: {
			findFirst: jest.fn(),
			findUnique: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		},
		$transaction: jest.fn((fn) => fn(require('../utils/prisma').prisma)),
	},
}))

import { prisma } from '../utils/prisma'
import { archiveOrgUnit, reparentOrgUnit } from './organizationUnits'
import { createMembership, endMembership } from './memberships'

describe('archiveOrgUnit', () => {
	beforeEach(() => jest.clearAllMocks())

	it('marks the unit as archived', async () => {
		;(prisma.organizationUnit.updateMany as jest.Mock).mockResolvedValue({
			count: 1,
		})
		const result = await archiveOrgUnit('unit-1', 1)
		expect(result.count).toBe(1)
		expect(prisma.organizationUnit.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					id: 'unit-1',
					organizationId: 1,
					archivedAt: null,
				}),
				data: expect.objectContaining({ archivedAt: expect.any(Date) }),
			}),
		)
	})

	it('returns count 0 when unit is already archived or not found', async () => {
		;(prisma.organizationUnit.updateMany as jest.Mock).mockResolvedValue({
			count: 0,
		})
		const result = await archiveOrgUnit('unit-1', 1)
		expect(result.count).toBe(0)
	})
})

describe('reparentOrgUnit - cycle detection', () => {
	beforeEach(() => jest.clearAllMocks())

	it('returns error when re-parent would create a cycle', async () => {
		;(prisma.organizationUnit.findFirst as jest.Mock).mockResolvedValueOnce({
			id: 'unit-a',
			organizationId: 1,
			archivedAt: null,
		})
		// Parent belongs to same org and is not archived
		;(prisma.organizationUnit.findFirst as jest.Mock).mockResolvedValueOnce({
			id: 'unit-b',
			organizationId: 1,
			archivedAt: null,
		})
		// Cycle check: unit-a IS an ancestor of unit-b
		;(
			prisma.organizationUnitAncestry.findFirst as jest.Mock
		).mockResolvedValueOnce({
			ancestorId: 'unit-a',
			descendantId: 'unit-b',
			depth: 1,
		})

		const error = await reparentOrgUnit('unit-a', 1, 'unit-b')
		expect(error).toBe('Re-parent would create a cycle')
	})

	it('returns error when new parent is archived', async () => {
		;(prisma.organizationUnit.findFirst as jest.Mock).mockResolvedValueOnce({
			id: 'unit-a',
			organizationId: 1,
			archivedAt: null,
		})
		;(prisma.organizationUnit.findFirst as jest.Mock).mockResolvedValueOnce({
			id: 'unit-b',
			organizationId: 1,
			archivedAt: new Date(),
		})

		const error = await reparentOrgUnit('unit-a', 1, 'unit-b')
		expect(error).toBe('Cannot move unit under an archived parent')
	})
})

describe('createMembership - validation', () => {
	beforeEach(() => jest.clearAllMocks())

	it('rejects assignment to archived unit', async () => {
		;(prisma.organizationUnit.findUnique as jest.Mock).mockResolvedValue({
			id: 'unit-1',
			archivedAt: new Date(),
		})
		const result = await createMembership({
			unitId: 'unit-1',
			participantId: 42,
		})
		expect(result).toEqual({ error: 'Cannot assign to archived unit' })
	})

	it('rejects duplicate active membership', async () => {
		;(prisma.organizationUnit.findUnique as jest.Mock).mockResolvedValue({
			id: 'unit-1',
			archivedAt: null,
		})
		;(prisma.unit2participant.findFirst as jest.Mock).mockResolvedValue({
			id: 'existing-id',
		})
		const result = await createMembership({
			unitId: 'unit-1',
			participantId: 42,
		})
		expect(result).toEqual({
			error: 'Active membership already exists for this unit',
		})
	})

	it('creates membership when validation passes', async () => {
		;(prisma.organizationUnit.findUnique as jest.Mock).mockResolvedValue({
			id: 'unit-1',
			archivedAt: null,
		})
		;(prisma.unit2participant.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.unit2participant.create as jest.Mock).mockResolvedValue({
			id: 'new-id',
		})
		const result = await createMembership({
			unitId: 'unit-1',
			participantId: 42,
		})
		expect(result).toEqual({ id: 'new-id' })
	})
})

describe('endMembership - validation', () => {
	beforeEach(() => jest.clearAllMocks())

	it('rejects effectiveTo before effectiveFrom', async () => {
		const effectiveFrom = new Date('2026-01-10')
		;(prisma.unit2participant.findUnique as jest.Mock).mockResolvedValue({
			id: 'm-1',
			effectiveFrom,
			effectiveTo: null,
		})
		const error = await endMembership('m-1', {
			effectiveTo: new Date('2026-01-05'),
		})
		expect(error).toBe('effectiveTo must be after effectiveFrom')
	})

	it('rejects ending an already-ended membership', async () => {
		;(prisma.unit2participant.findUnique as jest.Mock).mockResolvedValue({
			id: 'm-1',
			effectiveFrom: new Date('2026-01-01'),
			effectiveTo: new Date('2026-01-15'),
		})
		const error = await endMembership('m-1', { effectiveTo: new Date() })
		expect(error).toBe('Membership is already ended')
	})
})
