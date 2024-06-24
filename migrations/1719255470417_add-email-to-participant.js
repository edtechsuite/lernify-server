/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'students'
exports.up = (pgm) => {
	pgm.addColumns(tableName, {
		// According to email standards (RFC 5321 and RFC 5322), the maximum length of an email address is 320 characters
		email: { type: 'varchar(320)' },
	})
}

exports.down = (pgm) => {
	pgm.dropColumns(tableName, ['email'])
}
