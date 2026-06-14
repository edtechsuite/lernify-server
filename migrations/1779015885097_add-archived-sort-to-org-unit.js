/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'organizationUnit'

exports.up = (pgm) => {
	pgm.addColumn(tableName, {
		archivedAt: {
			type: 'timestamp',
			notNull: false,
		},
		sortOrder: {
			type: 'integer',
			notNull: true,
			default: 0,
		},
	})

	pgm.createIndex(tableName, ['organizationId', 'archivedAt'])
}

exports.down = (pgm) => {
	pgm.dropIndex(tableName, ['organizationId', 'archivedAt'])
	pgm.dropColumn(tableName, ['archivedAt', 'sortOrder'])
}
