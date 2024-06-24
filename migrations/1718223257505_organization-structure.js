/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'organizationUnit'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: {
			type: 'uuid',
			primaryKey: true,
		},
		organizationId: {
			type: 'integer',
			notNull: true,
			references: 'organizations(id)',
		},
		name: {
			type: 'varchar(1000)',
			notNull: true,
			default: '',
		},
		parentId: {
			type: 'uuid',
			references: '"organizationUnit"(id)',
		},
	})
}

exports.down = (pgm) => {
	pgm.dropTable(tableName)
}
