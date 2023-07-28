import { FastifyInstance } from 'fastify'
import { App } from './app'

describe('Application', () => {
	const testUser = {
		id: 0,
		name: 'Test User',
		email: 'test.user@localhost',
		outerId: 'mockUserId',
	}
	let app: FastifyInstance = undefined as unknown as FastifyInstance
	beforeAll(async () => {
		app = await App()
	})
	afterAll(async () => {
		await app.close()
	})

	test('should handle user editing', async () => {
		const user = {
			id: 0,
			name: 'name',
			email: 'email',
			outerId: 'outerId',
			systemRole: null,
		}
		const newUser = {
			...user,
			name: 'John Doe',
		}
		require('pg').queryMock.mockImplementation(() => ({
			rows: [newUser],
		}))
		let response = await app.inject({
			method: 'PUT',
			url: `/users/${testUser.id}`,
			headers: {
				authorization: 'token',
			},
			payload: newUser,
		})

		expect(response.statusCode).toBe(200)
		expect(JSON.parse(response.body)).toEqual(newUser)

		response = await app.inject({
			method: 'GET',
			url: `/auth/me`,
			headers: {
				authorization: 'token',
			},
		})

		expect(response.statusCode).toBe(200)
		expect(JSON.parse(response.body)).toEqual(newUser)
	})

	test.skip('should handle user creation', async () => {
		console.log('test user 111', testUser)
	})

	test.skip("should reject when user try to edit other user and doesn't have admin role", async () => {})
})
