/* eslint-disable camelcase */
const { getCommonColumns } = require('./utils/commonColumns')

exports.shorthands = undefined

const tableName = 'usersToOrganizations'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: 'id',
		userId: {
			type: 'integer',
			notNull: true,
			references: 'users(id)',
		},
		organizationId: {
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
