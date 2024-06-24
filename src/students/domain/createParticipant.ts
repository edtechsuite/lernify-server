import { v4 } from 'uuid'
import { prisma } from '../../utils/prisma'
import { StudentCreate } from '../types'

export function createParticipant(
	params: StudentCreate,
	orgId: number,
	userId: number
) {
	const { name, tags, outerId, unit } = params
	return prisma.students.create({
		data: {
			name,
			tags: tags.map((t) => t.trim()),
			outerId,
			organization: orgId,
			updatedBy: userId,
			unit2participant: unit
				? {
						create: {
							id: v4(),
							unitId: unit,
						},
				  }
				: undefined,
		},
	})
}
