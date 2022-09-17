const queryMock = jest.fn(() => Promise.resolve({ rows: [] }))

module.exports = {
	Pool: jest.fn(() => {
		return {
			query: queryMock,
			connect: jest.fn(() =>
				Promise.resolve({
					query: queryMock,
					release: jest.fn(),
				})
			),
			end: jest.fn((done) => {
				done()
				return Promise.resolve()
			}),
		}
	}),
	queryMock,
}
