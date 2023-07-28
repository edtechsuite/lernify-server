import { FastifyInstance } from 'fastify'
import { App } from '../app'
import { mockUserAndOrganizationFromPG } from '../utils/tests'

jest.mock('../utils/prisma')

describe('Activities', () => {
	let app: FastifyInstance = undefined as unknown as FastifyInstance
	beforeAll(async () => {
		app = await App()
	})
	afterAll(async () => {
		await app.close()
	})

	test('organizations administrator should be able to update profiles', async () => {
		mockUserAndOrganizationFromPG()
		const prisma = require('../utils/prisma').prisma
		prisma.usersToOrganizations.findFirstOrThrow.mockResolvedValue(profile)

		const update = prisma.usersToOrganizations.update
		const id = 1
		let response = await app.inject({
			method: 'PUT',
			url: `/profiles/${id}`,
			headers: {
				authorization: 'token',
				'x-organization': '1',
			},
			payload: { name: 'new name' },
		})

		expect(response.statusCode).toBe(200)
		expect(update).toBeCalled()
	})
})

const user = {
	id: 0,
	name: 'name',
	email: 'email',
	outerId: 'outerId',
	systemRole: null,
}

const profile = {
	id: 0,
	user,
	role: 'Administrator',
}
