import { createChat, CancelledCompletionError } from 'completions'
import { prisma } from '../utils/prisma'

const OPENAI_API_KEY = ''

const chat = createChat({
	apiKey: OPENAI_API_KEY,
	model: 'gpt-3.5-turbo',
	functions: [
		{
			name: 'get_groups_of_student',
			description: 'Get groups of the student',
			parameters: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						description: 'The name, e.g. John Doe',
					},
				},
				required: ['name'],
			},
			function: async ({ name }) => {
				console.log('=-= 🚀 ~ function: ~ name:', name)
				const result = await prisma.activities.findMany({
					where: {
						studentsToActivities: {
							some: {
								participant: {
									name,
								},
							},
						},
					},
				})
				console.log('=-= 🚀 ~ function: ~ result:', result)

				return result.map((activity) => ({
					name: activity.name,
					deleted: activity.deleted,
					archived: activity.archived,
				}))
			},
		},
	],
	functionCall: 'auto',
})

export async function sendMessage(msg: string) {
	console.log('=-= 🚀 ~ sendMessage ~ msg:', msg)
	return await chat.sendMessage(msg)
}
