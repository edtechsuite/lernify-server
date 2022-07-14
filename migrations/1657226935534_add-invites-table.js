/* eslint-disable camelcase */

const { getCommonColumns } = require('./utils/commonColumns')

exports.shorthands = undefined

const tableName = 'invites'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: 'id',
		email: { type: 'varchar(1000)', notNull: true, unique: true },
		token: { type: 'varchar(100)', notNull: true },
		role: { type: 'varchar(100)', notNull: true },
		organization: {
			type: 'integer',
			notNull: true,
			references: 'organizations(id)',
		},
		dueTo: {
			type: 'timestamp',
			notNull: true,
		},

		...getCommonColumns(pgm),
	})
}

exports.down = (pgm) => {
	pgm.dropTable(tableName)
}
