import { v4 } from 'uuid'
import { prisma } from '../../utils/prisma'
import { StudentCreate } from '../types'

export async function createParticipant(
	params: StudentCreate,
	orgId: number,
	userId: number
) {
	const { name, tags, outerId, unit, email } = params
	if (email) {
		const existingStudent = await prisma.students.findFirst({
			where: {
				email,
				organization: orgId,
			},
		})
		if (existingStudent) {
			// TODO: use custom error to be able to handle it on the API level
			throw new Error('Participant with this email already exists')
		}
	}
	return prisma.students.create({
		data: {
			name,
			tags: tags.map((t) => t.trim()),
			outerId,
			email,
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
