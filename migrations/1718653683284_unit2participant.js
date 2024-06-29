/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'unit2participant'
exports.up = (pgm) => {
	pgm.createTable(tableName, {
		id: {
			type: 'uuid',
			primaryKey: true,
		},
		unitId: {
			type: 'uuid',
			notNull: true,
			references: '"organizationUnit"(id)',
		},
		participantId: {
			type: 'integer',
			references: 'students(id)',
		},
	})
}

exports.down = (pgm) => {
	pgm.dropTable(tableName)
}
