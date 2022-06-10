/* eslint-disable camelcase */
const { getCommonColumns } = require('./utils/commonColumns')

exports.shorthands = undefined

const tableName = 'organizations'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: 'id',
		key: { type: 'varchar(1000)', notNull: true },
		name: { type: 'varchar(1000)', notNull: true },
		owner: {
			type: 'integer',
			notNull: true,
			references: 'users(id)',
		},
		...getCommonColumns(pgm),
	})
}

exports.down = (pgm) => {
	pgm.dropTable(tableName)
}
