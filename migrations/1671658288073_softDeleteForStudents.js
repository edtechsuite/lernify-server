/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'students'
exports.up = (pgm) => {
	pgm.addColumns(tableName, {
		deleted: {
			type: 'boolean',
			notNull: true,
			default: 'false',
		},
	})
}

exports.down = (pgm) => {
	pgm.dropColumns(tableName, ['deleted'])
}
