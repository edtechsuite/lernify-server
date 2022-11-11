/* eslint-disable camelcase */
const { getCommonColumns } = require('./utils/commonColumns')

exports.shorthands = undefined

const tableName = 'students'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: 'id',
		name: { type: 'varchar(256)', notNull: true },
		tags: { type: 'varchar(256)[]', notNull: true, default: '{}' },
		outerId: { type: 'varchar(1000)', notNull: true, unique: true },
		organization: {
			type: 'integer',
			notNull: true,
			references: 'organizations(id)',
		},

		...getCommonColumns(pgm),
	})
}

exports.down = (pgm) => {
	pgm.dropTable(tableName)
}
