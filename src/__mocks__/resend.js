module.exports = {
	Resend: function () {
		return {
			emails: {
				send: jest.fn(),
			},
		}
	},
}
