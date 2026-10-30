jest.mock('../utils/prisma', () => ({
	prisma: {
		$queryRaw: jest.fn(),
	},
}))

import { prisma } from '../utils/prisma'
import {
	escapeIlike,
	findStudents,
	findStudentsByActivity,
	toIlikePattern,
} from './students'

describe('escapeIlike', () => {
	it('leaves plain strings unchanged', () => {
		expect(escapeIlike('Alice Smith')).toBe('Alice Smith')
	})

	it('escapes %, _, and \\ characters', () => {
		expect(escapeIlike('100%')).toBe('100\\%')
		expect(escapeIlike('user_name')).toBe('user\\_name')
		expect(escapeIlike('path\\to\\file')).toBe('path\\\\to\\\\file')
		expect(escapeIlike('a%b_c\\d')).toBe('a\\%b\\_c\\\\d')
	})
})

describe('toIlikePattern', () => {
	it('returns null when filter is undefined, empty, or whitespace-only', () => {
		expect(toIlikePattern(undefined)).toBeNull()
		expect(toIlikePattern('')).toBeNull()
		expect(toIlikePattern('   ')).toBeNull()
	})

	it('trims and wraps escaped filter in % wildcards', () => {
		expect(toIlikePattern('  ali  ')).toBe('%ali%')
		expect(toIlikePattern('100%')).toBe('%100\\%%')
	})
})

describe('findStudents and findStudentsByActivity', () => {
	const mockQueryRaw = prisma.$queryRaw as jest.Mock

	type MockStudent = {
		id: number
		organization: number
		deleted: boolean
		name: string
		email: string | null
		tags: string[]
	}

	const sampleStudents: MockStudent[] = [
		{
			id: 1,
			organization: 10,
			deleted: false,
			name: 'Alice Smith',
			email: 'alice@school.org',
			tags: ['math', 'advanced'],
		},
		{
			id: 2,
			organization: 10,
			deleted: false,
			name: 'Bob Jones',
			email: 'bob@example.com',
			tags: ['Beginner-2026'],
		},
		{
			id: 3,
			organization: 10,
			deleted: false,
			name: 'Charlie 100% Effort',
			email: 'charlie_1@test.org',
			tags: ['c\\sharp'],
		},
		{
			id: 4,
			organization: 10,
			deleted: true,
			name: 'Alice Deleted',
			email: 'alice.del@example.com',
			tags: ['Beginner-2026'],
		},
		{
			id: 5,
			organization: 99,
			deleted: false,
			name: 'Alice OtherOrg',
			email: 'alice@example.com',
			tags: ['Beginner-2026'],
		},
	]

	function ilikeMatch(text: string | null, pattern: string): boolean {
		if (text === null) return false
		// Convert SQL ILIKE pattern with ESCAPE '\' to RegExp
		let regexStr = '^'
		for (let i = 0; i < pattern.length; i++) {
			const ch = pattern[i]
			if (ch === '\\' && i + 1 < pattern.length) {
				i++
				regexStr += pattern[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			} else if (ch === '%') {
				regexStr += '.*'
			} else if (ch === '_') {
				regexStr += '.'
			} else {
				regexStr += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			}
		}
		regexStr += '$'
		return new RegExp(regexStr, 'i').test(text)
	}

	beforeEach(() => {
		jest.clearAllMocks()
		mockQueryRaw.mockImplementation(
			async (
				strings: TemplateStringsArray,
				orgId: number,
				nullCheckPattern: string | null,
				namePattern: string | null,
				emailPattern: string | null,
				tagPattern: string | null
			) => {
				const sql = strings.join('?')
				// Verify the query targets the "students" table
				expect(sql).toContain('FROM "students"')
				// Verify soft-deleted students are excluded in SQL
				expect(sql).toContain('"deleted" = false')
				// Verify tags are unnested individually so substrings cannot match across adjacent tags
				expect(sql).toContain('unnest("tags")')
				// Verify the SQL ILIKE clause specifies '\' as the escape character so escaped %, _, and \ match literally
				expect(sql).toContain("ESCAPE '\\'")

				return sampleStudents.filter(
					(s) =>
						s.organization === orgId &&
						!s.deleted &&
						(nullCheckPattern === null ||
							ilikeMatch(s.name, namePattern!) ||
							ilikeMatch(s.email, emailPattern!) ||
							s.tags.some((t) => ilikeMatch(t, tagPattern!)))
				)
			}
		)
	})

	it('returns all non-deleted students in organization when filter is absent or whitespace', async () => {
		const students = await findStudents(10, '   ')
		expect(students.map((s) => s.id)).toEqual([1, 2, 3])
		expect(mockQueryRaw).toHaveBeenCalledTimes(1)
	})

	it('matches student by name (case-insensitive) in a single DB call', async () => {
		const students = await findStudents(10, 'ali')
		expect(students.map((s) => s.id)).toEqual([1])
		expect(mockQueryRaw).toHaveBeenCalledTimes(1)
		const [, orgId, pattern] = mockQueryRaw.mock.calls[0]
		expect(orgId).toBe(10)
		expect(pattern).toBe('%ali%')
	})

	it('matches student by email (case-insensitive)', async () => {
		const students = await findStudents(10, 'EXAMPLE.COM')
		expect(students.map((s) => s.id)).toEqual([2])
	})

	it('matches student by tag substring and does not match across separate tags', async () => {
		const students = await findStudents(10, 'beg')
		expect(students.map((s) => s.id)).toEqual([2])

		const crossTagStudents = await findStudents(10, 'math advanced')
		expect(crossTagStudents).toEqual([])
	})

	it('trims leading and trailing whitespace from filter', async () => {
		const students = await findStudents(10, '  ali  ')
		expect(students.map((s) => s.id)).toEqual([1])
		const [, , pattern] = mockQueryRaw.mock.calls[0]
		expect(pattern).toBe('%ali%')
	})

	it('escapes %, _, and \\ in filter so they match literally', async () => {
		const percentStudents = await findStudents(10, '100%')
		expect(percentStudents.map((s) => s.id)).toEqual([3])
		expect(mockQueryRaw.mock.calls[0][2]).toBe('%100\\%%')

		const underscoreStudents = await findStudents(10, 'charlie_1')
		expect(underscoreStudents.map((s) => s.id)).toEqual([3])
		expect(mockQueryRaw.mock.calls[1][2]).toBe('%charlie\\_1%')

		const backslashStudents = await findStudents(10, 'c\\sharp')
		expect(backslashStudents.map((s) => s.id)).toEqual([3])
		expect(mockQueryRaw.mock.calls[2][2]).toBe('%c\\\\sharp%')
	})

	it('queries activity participants in a single DB call via findStudentsByActivity', async () => {
		mockQueryRaw.mockResolvedValueOnce([sampleStudents[0]])
		const result = await findStudentsByActivity({
			activityId: 42,
			organizationId: 10,
			filter: 'ali',
		})
		expect(result).toEqual([sampleStudents[0]])
		expect(mockQueryRaw).toHaveBeenCalledTimes(1)
		const [strings, activityId, orgId, , , , , , , pattern] =
			mockQueryRaw.mock.calls[0]
		const sql = (strings as TemplateStringsArray).join('?')
		expect(sql).toContain('FROM "studentsToActivities" sta')
		expect(sql).toContain('INNER JOIN "students" s')
		expect(activityId).toBe(42)
		expect(orgId).toBe(10)
		expect(pattern).toBe('%ali%')
	})
})
