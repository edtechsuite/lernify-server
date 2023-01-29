/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'activities'
exports.up = (pgm) => {
	pgm.addColumns(tableName, {
		archived: {
			type: 'boolean',
			notNull: true,
			default: 'false',
		},
	})
}

exports.down = (pgm) => {
	pgm.dropColumns(tableName, ['archived'])
}
