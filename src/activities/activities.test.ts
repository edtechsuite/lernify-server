import { FastifyInstance } from 'fastify'
import { App } from '../app'

jest.mock('../utils/prisma')
jest.mock('../firebase/events')

describe('Activities', () => {
	let app: FastifyInstance = undefined as unknown as FastifyInstance
	beforeAll(async () => {
		app = await App()
	})
	afterAll(async () => {
		await app.close()
	})

	test('should handle unassign performer from activity', async () => {
		const user = {
			id: 0,
			name: 'name',
			email: 'email',
			outerId: 'outerId',
			systemRole: null,
		}
		require('pg').queryMock.mockImplementation(() => ({
			rows: [user],
		}))
		const update = require('../utils/prisma').prisma.activities.update
		const id = 1
		let response = await app.inject({
			method: 'PUT',
			url: `/activities/${id}`,
			headers: {
				authorization: 'token',
				'x-organization': '1',
			},
			payload: { performerId: null },
		})

		expect(response.statusCode).toBe(200)
		expect(update.mock.calls[0][0].data.performerId).toBeNull()
	})
})
