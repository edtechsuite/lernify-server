/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'usersToOrganizations'
exports.up = (pgm) => {
	pgm.addColumns(tableName, {
		deleted: {
			type: 'boolean',
			notNull: true,
			default: 'false',
		},
		name: { type: 'varchar(1000)', notNull: true, default: '' },
	})

	pgm.sql(
		`UPDATE "${tableName}" SET name=(SELECT name FROM users WHERE "${tableName}"."userId"=users.id);`
	)
}

exports.down = (pgm) => {
	pgm.dropColumns(tableName, ['deleted', 'name'])
}
