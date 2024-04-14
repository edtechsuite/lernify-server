/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'api_tokens'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: 'id',
		lastReset: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp'),
		},
		userId: {
			type: 'integer',
			notNull: true,
			references: 'users(id)',
		},
	})
}

exports.down = (pgm) => {
	pgm.dropTable(tableName)
}
