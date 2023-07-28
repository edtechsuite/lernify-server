export function mockUserAndOrganizationFromPG(user = userMock, org = orgMock) {
	require('pg').queryMock.mockImplementation((query: string) => {
		if (query.includes('FROM users')) return { rows: [user] }
		if (query.includes('FROM "organizations"')) return { rows: [org] }
	})
}
const userMock = {
	id: 0,
	name: 'name',
	email: 'email',
	outerId: 'outerId',
	systemRole: null,
}

const orgMock = {
	id: 0,
}
