import { FastifyInstance } from 'fastify'
import { reportByStudentsTags } from './domain'

export function initHandlers(app: FastifyInstance) {
	app.get<{
		Querystring: {
			from?: string
			to?: string
			tags?: string | string[]
			order?: 'asc' | 'desc'
			orderBy?: 'rate' | 'participantName' | 'activityName'
		}
	}>(
		'/',
		{
			preHandler: [app.verifyJWT],
			schema: {
				querystring: {
					type: 'object',
					properties: {
						from: { type: 'string' },
						to: { type: 'string' },
						order: { enum: ['asc', 'desc'] },
						orderBy: { enum: ['rate', 'participantName', 'activityName'] },
					},
				},
			},
		},
		async (req) => {
			const { organization } = req
			const { from, to, tags = [], order, orderBy } = req.query
			if (!from || !to) {
				throw new Error('`from` and `to` are required')
			}
			const fromDate = new Date(from)
			const toDate = new Date(to)
			if (!fromDate || !toDate) {
				throw new Error('Invalid date format')
			}
			if (fromDate > toDate) {
				throw new Error('`from` must be less than `to`')
			}

			// Temporary disabled due to issues with another solution

			// const oneMonth = 1000 * 60 * 60 * 24 * 31
			// const oneMonthAndOneDay = oneMonth + 1000 * 60 * 60 * 24
			// if (toDate.getTime() - fromDate.getTime() > oneMonthAndOneDay) {
			// 	throw new Error('Date range must be less than 31 days')
			// }

			return reportByStudentsTags(
				organization!.key,
				{
					from: new Date(from),
					to: new Date(to),
				},
				typeof tags === 'string' ? [tags] : tags,
				order,
				orderBy
			)
		}
	)
}
