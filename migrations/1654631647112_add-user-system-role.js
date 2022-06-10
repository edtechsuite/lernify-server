/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'users'
exports.up = (pgm) => {
	pgm.addColumns(tableName, {
		systemRole: { type: 'varchar(100)' },
	})

	const adminEmail = process.env.ADMIN_EMAIL
	if (!adminEmail) {
		throw new Error('ADMIN_EMAIL env var is not set')
	}

	pgm.sql(
		`UPDATE ${tableName} SET "systemRole" = 'system-administrator' WHERE email = '${adminEmail}'`
	)
}

exports.down = (pgm) => {
	pgm.dropColumns(tableName, ['systemRole'])
}
