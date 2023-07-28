module.exports = {
	prisma: {
		activities: {
			findFirstOrThrow: jest.fn(() => Promise.resolve({})),
			update: jest.fn(() => Promise.resolve({})),
		},
		usersToOrganizations: {
			findFirstOrThrow: jest.fn(() => Promise.resolve({})),
			update: jest.fn(() => Promise.resolve({})),
		},
	},
}
