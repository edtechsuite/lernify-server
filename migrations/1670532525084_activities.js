/* eslint-disable camelcase */
const { getCommonColumns } = require('./utils/commonColumns')

exports.shorthands = undefined

const tableName = 'activities'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: 'id',
		type: { type: 'varchar(256)', notNull: true },
		performer: {
			type: 'integer',
			references: 'users(id)',
		},
		name: { type: 'varchar(256)', notNull: true },
		outerId: { type: 'varchar(1000)', notNull: true, unique: true },
		organization: {
			type: 'integer',
			notNull: true,
			references: 'organizations(id)',
		},
		deleted: {
			type: 'boolean',
			notNull: true,
			default: 'false',
		},
		...getCommonColumns(pgm),
	})
}

exports.down = (pgm) => {
	pgm.dropTable(tableName)
}
