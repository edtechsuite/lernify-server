/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'users'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: 'id',
		name: { type: 'varchar(1000)', notNull: true },
		email: { type: 'varchar(1000)', notNull: true, unique: true },
		outerId: { type: 'varchar(1000)', notNull: true, unique: true },
		createdAt: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp'),
		},
	})
}

exports.down = (pgm) => {
	pgm.dropTable(tableName)
}
