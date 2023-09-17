import { FastifyInstance } from 'fastify'
import { reportByStudentsTags } from './domain'

export function initHandlers(app: FastifyInstance) {
	app.get<{
		Querystring: {
			from?: string
			to?: string
			tags?: string[]
			order?: 'asc' | 'desc'
		}
	}>(
		'/',
		{
			preHandler: [app.verifyJWT],
		},
		async (req) => {
			const { organization } = req
			const { from, to, tags, order } = req.query
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
			const oneMonth = 1000 * 60 * 60 * 24 * 31
			const oneMonthAndOneDay = oneMonth + 1000 * 60 * 60 * 24
			if (toDate.getTime() - fromDate.getTime() > oneMonthAndOneDay) {
				throw new Error('Date range must be less than 31 days')
			}

			return reportByStudentsTags(
				organization!.key,
				{
					from: new Date(from),
					to: new Date(to),
				},
				tags || [],
				order
			)
		}
	)
}
